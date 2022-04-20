const dayjs = require('dayjs');

/**
 * @param {Mysql} [db]
 */
module.exports = (db) => {
  /**
   * 상품 타입 목록
   */
  const itemTypeList = {
    'cash': '현금',
    'deposit': '예금',
    'saving': '적금',
    'trade': '매매',
    'future': '선물',
    'defi': '디파이',
    'p2p': 'P2P'
  };
  /**
   * 기록 타입 목록
   */
  const historyTypeList = {
    'in': '유입',
    'out': '유출',
    'revenue': '평가'
  };
  /**
   * 유입/유출 타입 목록
   */
  const inoutTypeList = {
    'principal': '원금',
    'proceeds': '수익금',
  };
  /**
   * 평가 타입 목록
   */
  const revenueTypeList = {
    'interest': '이자',
    'eval': '평가금액'
  };
  
  /**
   * 모든 요약 데이터 insert/update
   * @param {number} itemIdx 상품 IDX
   * @param {string} date 날짜
   * @param {number} unitIdx 단위 IDX
   * @param {Knex.Transaction} [trx] DB 트랜잭션
   * @return {Promise<void>}
   */
  const upsertSummary = async (itemIdx, date, unitIdx, trx) => {
    try {
      await upsertMonthSummary(itemIdx, date, unitIdx, trx);
      await updateBeforeMonthSummary(itemIdx, date, unitIdx, trx);
      
      await upsertYearSummary(itemIdx, date, unitIdx, trx);
      await updateBeforeYearSummary(itemIdx, date, unitIdx, trx);
      
      await upsertTotalSummary(itemIdx, unitIdx, trx);
    } catch (err) {
      throw err;
    }
  }
  
  /**
   * 월간 요약 데이터 insert/update
   * @param {number} itemIdx 상품 IDX
   * @param {string} date 날짜
   * @param {number} unitIdx 단위 IDX
   * @param {Knex.Transaction} [trx] DB 트랜잭션
   * @return {Promise<void>}
   */
  const upsertMonthSummary = async (itemIdx, date, unitIdx, trx) => {
    //set vars: 날짜 관련
    const targetDate = date ? dayjs(date) : dayjs();
    const startDate = targetDate.format('YYYY-MM-01');
    const endDate = targetDate.endOf('month').format('YYYY-MM-DD');
    const summaryDate = startDate;
  
    //check data
    const hasItem = await db.exists(db.queryBuilder()
        .from('invest_item')
        .where('item_idx', itemIdx)
      );
    if (!hasItem) return;
    const hasUnit = await db.execute(db.queryBuilder()
        .from('invest_unit_set')
        .where('item_idx', itemIdx)
        .andWhere('unit_idx', unitIdx)
      );
    if (!hasUnit) return;
    
    //set vars: 쿼리 빌더
    let query;
    
    try {
      //set vars: insert/update 할 데이터
      const upsertData = {
        'inout_total': 0,
        'inout_principal_prev': 0,
        'inout_principal_current': 0,
        'inout_principal_total': 0,
        'inout_proceeds_prev': 0,
        'inout_proceeds_current': 0,
        'inout_proceeds_total': 0,
        'revenue_total': 0,
        'revenue_interest_prev': 0,
        'revenue_interest_current': 0,
        'revenue_interest_total': 0,
        'revenue_eval': 0,
        'revenue_eval_prev': 0,
        'earn': 0,
        'earn_prev_diff': 0,
        'earn_rate': 0,
        'earn_rate_prev_diff': 0,
        'earn_inc_proceeds': 0,
        'earn_inc_proceeds_prev_diff': 0,
        'earn_rate_inc_proceeds': 0,
        'earn_rate_inc_proceeds_prev_diff': 0
      };
      
      //set vars: 이전달 요약 데이터
      query = db.queryBuilder()
        .select()
        .from('invest_summary_date')
        .where('summary_type', 'month')
        .andWhere('summary_date', '<', summaryDate)
        .andWhere('item_idx', itemIdx)
        .andWhere('unit_idx', unitIdx)
        .orderBy('summary_date', 'desc')
        .limit(1);
      const rsPrevSummary = await db.queryRow(query, trx ?? null);
      
      //생성할 요약 데이터에 이전달 요약 데이터 저장
      let prevEarn = 0;
      let prevEarnIncProceeds = 0;
      let prevEarnRate = 0;
      let prevEarnRateIncProceeds = 0;
      if (rsPrevSummary) {
        prevEarn = rsPrevSummary.earn;
        prevEarnIncProceeds = rsPrevSummary.earn_inc_proceeds;
        prevEarnRate = rsPrevSummary.earn_rate;
        prevEarnRateIncProceeds = rsPrevSummary.earn_rate_inc_proceeds;
        
        upsertData.inout_principal_prev = rsPrevSummary.inout_principal_total;
        upsertData.inout_principal_total += rsPrevSummary.inout_principal_total;
  
        upsertData.inout_proceeds_prev = rsPrevSummary.inout_proceeds_total;
        upsertData.inout_proceeds_total += rsPrevSummary.inout_proceeds_total;
  
        upsertData.revenue_interest_prev = rsPrevSummary.revenue_interest_total;
        upsertData.revenue_interest_total += rsPrevSummary.revenue_interest_total;
        upsertData.revenue_eval_prev = rsPrevSummary.revenue_eval;
      }
      
      //set vars: 유입/유출/평가(이자) 요약 데이터
      query = `
        SELECT
          history_type,
          IF(history_type = 'inout', inout_type, revenue_type) AS val_type,
          SUM(val) as total_val
        FROM invest_history
        WHERE
          item_idx = :itemIdx
          AND unit_idx = :unitIdx
          AND history_date BETWEEN :startDate AND :endDate
          AND (history_type = 'inout' OR (history_type = 'revenue' AND revenue_type = 'interest'))
        GROUP BY history_type, val_type
      `;
      const rsSummary1 = await db.executeRaw(query, {itemIdx, unitIdx, startDate, endDate}, trx ?? null);
      
      //생성할 요약 데이터에 가져온 데이터 저장
      for (const summary of rsSummary1) {
        if (summary['history_type'] == 'inout') {
          if (summary['val_type'] == 'principal') {
            upsertData.inout_principal_current = summary['total_val'];
            upsertData.inout_principal_total += summary['total_val'];
          } else {
            upsertData.inout_proceeds_current = summary['total_val'];
            upsertData.inout_proceeds_total += summary['total_val'];
          }
        } else {
          upsertData.revenue_interest_current = summary['total_val'];
          upsertData.revenue_interest_total += summary['total_val'];
        }
      }
      
      //set vars: 평가(평가금액) 요약 데이터
      query = db.queryBuilder()
        .select('val')
        .from('invest_history')
        .where('item_idx', itemIdx)
        .andWhere('unit_idx', unitIdx)
        .andWhere('history_date', '<=', endDate)
        .andWhere('history_type', 'revenue')
        .andWhere('revenue_type', 'eval')
        .orderBy([
          {column: 'history_date', order: 'desc'},
          {column: 'history_idx', order: 'desc'}
        ])
        .limit(1);
      const rsSummary2 = await db.queryRow(query, trx ?? null);
      
      //생성할 요약 데이터에 가져온 데이터 저장
      if (rsSummary2) {
        upsertData.revenue_eval = rsSummary2.val;
      }
      
      //유입/유출/평가 총합 계산
      upsertData.inout_total = upsertData.inout_principal_total + upsertData.inout_proceeds_total;
      upsertData.revenue_total = upsertData.revenue_interest_total + upsertData.revenue_eval;
      
      //수익율/수익금 계산
      upsertData.earn = upsertData.revenue_interest_total;
      upsertData.earn_inc_proceeds = upsertData.revenue_interest_total;
      if (upsertData.revenue_eval > 0) {
        upsertData.earn += upsertData.revenue_eval - upsertData.inout_principal_total;
        upsertData.earn_inc_proceeds += upsertData.revenue_eval - upsertData.inout_total;
      }
      if (upsertData.inout_principal_total != 0 && upsertData.earn != 0) {
        upsertData.earn_rate = upsertData.earn / upsertData.inout_principal_total;
      }
      if (upsertData.inout_total != 0 && upsertData.earn_inc_proceeds != 0) {
        upsertData.earn_rate_inc_proceeds = upsertData.earn_inc_proceeds / upsertData.inout_total;
      }
      
      // 이전달 대비 수익율/수익금 계산
      upsertData.earn_prev_diff = upsertData.earn;
      upsertData.earn_inc_proceeds_prev_diff = upsertData.earn_inc_proceeds;
      if (prevEarn != 0) {
        upsertData.earn_prev_diff -= prevEarn;
      }
      if (prevEarnIncProceeds != 0) {
        upsertData.earn_inc_proceeds_prev_diff -= prevEarnIncProceeds;
      }
      if (prevEarnRate != 0) {
        upsertData.earn_rate_prev_diff = upsertData.earn_rate - prevEarnRate;
      }
      if (prevEarnRateIncProceeds != 0) {
        upsertData.earn_rate_inc_proceeds_prev_diff = upsertData.earn_rate_inc_proceeds - prevEarnRateIncProceeds;
      }
      
      //set vars: 요약 데이터 존재 유무
      query = db.queryBuilder()
        .select('summary_idx')
        .from('invest_summary_date')
        .where('summary_type', 'month')
        .andWhere('summary_date', summaryDate)
        .andWhere('item_idx', itemIdx)
        .andWhere('unit_idx', unitIdx);
      const summaryIdx = await db.queryScalar(query, trx ?? null);
      
      // 요약 데이터 존재 유무에 따라 insert/update 처리
      if (!summaryIdx) {
        upsertData['summary_type'] = 'month';
        upsertData['summary_date'] = summaryDate;
        upsertData['item_idx'] = itemIdx;
        upsertData['unit_idx'] = unitIdx;
        
        query = db.queryBuilder().insert(upsertData).into('invest_summary_date');
      } else {
        query = db.queryBuilder()
          .update(upsertData)
          .from('invest_summary_date')
          .where('summary_idx', summaryIdx);
      }
  
      await db.execute(query, trx ?? null);
    } catch (err) {
      throw err;
    }
  }
  
  /**
   * 년간 요약 데이터 insert/update
   * @param {number} itemIdx 상품 IDX
   * @param {string} date 날짜
   * @param {number} unitIdx 단위 IDX
   * @param {Knex.Transaction} [trx] DB 트랜잭션
   * @return {Promise<void>}
   */
  const upsertYearSummary = async (itemIdx, date, unitIdx, trx) => {
    //set vars: 날짜 관련
    const targetDate = date ? dayjs(date) : dayjs();
    const startDate = targetDate.format('YYYY-01-01');
    const endDate = targetDate.month(11).endOf('month').format('YYYY-MM-DD');
    const summaryDate = startDate;
  
    //check data
    const hasItem = await db.exists(db.queryBuilder()
        .from('invest_item')
        .where('item_idx', itemIdx)
      );
    if (!hasItem) return;
    const hasUnit = await db.exists(db.queryBuilder()
        .from('invest_unit_set')
        .where('item_idx', itemIdx)
        .andWhere('unit_idx', unitIdx)
      );
    if (!hasUnit) return;
  
    //set vars: 쿼리 빌더
    let query;
  
    try {
      //set vars: insert/update 할 데이터
      const upsertData = {
        'inout_total': 0,
        'inout_principal_prev': 0,
        'inout_principal_current': 0,
        'inout_principal_total': 0,
        'inout_proceeds_prev': 0,
        'inout_proceeds_current': 0,
        'inout_proceeds_total': 0,
        'revenue_total': 0,
        'revenue_interest_prev': 0,
        'revenue_interest_current': 0,
        'revenue_interest_total': 0,
        'revenue_eval': 0,
        'revenue_eval_prev': 0,
        'earn': 0,
        'earn_prev_diff': 0,
        'earn_rate': 0,
        'earn_rate_prev_diff': 0,
        'earn_inc_proceeds': 0,
        'earn_inc_proceeds_prev_diff': 0,
        'earn_rate_inc_proceeds': 0,
        'earn_rate_inc_proceeds_prev_diff': 0
      };
      
      //set vars: 이전년도 요약 데이터
      query = db.queryBuilder()
        .select()
        .from('invest_summary_date')
        .where('summary_type', 'year')
        .andWhere('summary_date', '<', summaryDate)
        .andWhere('item_idx', itemIdx)
        .andWhere('unit_idx', unitIdx)
        .orderBy('summary_date', 'desc')
        .limit(1);
      const rsPrevSummary = await db.queryRow(query, trx ?? null);
  
      //생성할 요약 데이터에 이전달 요약 데이터 저장
      let prevEarn = 0;
      let prevEarnIncProceeds = 0;
      let prevEarnRate = 0;
      let prevEarnRateIncProceeds = 0;
      if (rsPrevSummary) {
        prevEarn = rsPrevSummary.earn;
        prevEarnIncProceeds = rsPrevSummary.earn_inc_proceeds;
        prevEarnRate = rsPrevSummary.earn_rate;
        prevEarnRateIncProceeds = rsPrevSummary.earn_rate_inc_proceeds;
    
        upsertData.inout_principal_prev = rsPrevSummary.inout_principal_total;
        upsertData.inout_principal_total += rsPrevSummary.inout_principal_total;
    
        upsertData.inout_proceeds_prev = rsPrevSummary.inout_proceeds_total;
        upsertData.inout_proceeds_total += rsPrevSummary.inout_proceeds_total;
    
        upsertData.revenue_interest_prev = rsPrevSummary.revenue_interest_total;
        upsertData.revenue_interest_total += rsPrevSummary.revenue_interest_total;
        upsertData.revenue_eval_prev = rsPrevSummary.revenue_eval;
      }
      
      //set vars: 이번 년도 요약 데이터(유입/유출, 평가-이자)
      query = `
        SELECT
          SUM(inout_principal_current) AS inout_principal_current,
          SUM(inout_proceeds_current) AS inout_proceeds_current,
          SUM(revenue_interest_current) AS revenue_interest_current
        FROM invest_summary_date
        WHERE
          summary_type = 'month'
          AND summary_date BETWEEN :startDate AND :endDate
          AND item_idx = :itemIdx
          AND unit_idx = :unitIdx
      `;
      let rsSummary1 = await db.executeRaw(query, {itemIdx, unitIdx, startDate, endDate}, trx ?? null);
      rsSummary1 = rsSummary1.length > 0 ? rsSummary1[0] : null;
  
      //생성할 요약 데이터에 가져온 데이터 저장
      if (rsSummary1) {
        upsertData.inout_principal_current = rsSummary1['inout_principal_current'];
        upsertData.inout_principal_total +=  rsSummary1['inout_principal_current'];
        
        upsertData.inout_proceeds_current = rsSummary1['inout_proceeds_current'];
        upsertData.inout_proceeds_total += rsSummary1['inout_proceeds_current'];
        
        upsertData.revenue_interest_current = rsSummary1['revenue_interest_current'];
        upsertData.revenue_interest_total += rsSummary1['revenue_interest_current'];
      }
      
      //set vars: 이번 년도 요약 데이터(평가-평가금액)
      query = db.queryBuilder()
        .select('revenue_eval')
        .from('invest_summary_date')
        .where('summary_type', 'month')
        .andWhereBetween('summary_date', [startDate, endDate])
        .andWhere('item_idx', itemIdx)
        .andWhere('unit_idx', unitIdx)
        .orderBy('summary_date', 'desc')
        .limit(1);
      const rsSummary2 = await db.queryRow(query, trx ?? null);
      
      //생성할 요약 데이터에 가져온 데이터 저장
      if (rsSummary2) {
        upsertData.revenue_eval = rsSummary2.revenue_eval;
      }
  
      //유입/유출/평가 총합 계산
      upsertData.inout_total = upsertData.inout_principal_total + upsertData.inout_proceeds_total;
      upsertData.revenue_total = upsertData.revenue_interest_total + upsertData.revenue_eval;
  
      //수익율/수익금 계산
      upsertData.earn = upsertData.revenue_interest_total;
      upsertData.earn_inc_proceeds = upsertData.revenue_interest_total;
      if (upsertData.revenue_eval != 0) {
        upsertData.earn += upsertData.revenue_eval - upsertData.inout_principal_total;
        upsertData.earn_inc_proceeds += upsertData.revenue_eval - upsertData.inout_total;
      }
      if (upsertData.inout_principal_total != 0 && upsertData.earn != 0) {
        upsertData.earn_rate = upsertData.earn / upsertData.inout_principal_total;
      }
      if (upsertData.inout_total != 0 && upsertData.earn_inc_proceeds != 0) {
        upsertData.earn_rate_inc_proceeds = upsertData.earn_inc_proceeds / upsertData.inout_total;
      }
  
      // 이전년도 대비 수익율/수익금 계산
      upsertData.earn_prev_diff = upsertData.earn;
      upsertData.earn_inc_proceeds_prev_diff = upsertData.earn_inc_proceeds;
      if (prevEarn != 0) {
        upsertData.earn_prev_diff -= prevEarn;
      }
      if (prevEarnIncProceeds != 0) {
        upsertData.earn_inc_proceeds_prev_diff -= prevEarnIncProceeds;
      }
      if (prevEarnRate != 0) {
        upsertData.earn_rate_prev_diff = upsertData.earn_rate - prevEarnRate;
      }
      if (prevEarnRateIncProceeds != 0) {
        upsertData.earn_rate_inc_proceeds_prev_diff = upsertData.earn_rate_inc_proceeds - prevEarnRateIncProceeds;
      }
  
      //set vars: 요약 데이터 존재 유무
      query = db.queryBuilder()
        .select('summary_idx')
        .from('invest_summary_date')
        .where('summary_type', 'year')
        .where('summary_date', summaryDate)
        .andWhere('item_idx', itemIdx)
        .andWhere('unit_idx', unitIdx);
      const summaryIdx = await db.queryScalar(query, trx ?? null);
  
      // 요약 데이터 존재 유무에 따라 insert/update 처리
      if (!summaryIdx) {
        upsertData['summary_type'] = 'year';
        upsertData['summary_date'] = summaryDate;
        upsertData['item_idx'] = itemIdx;
        upsertData['unit_idx'] = unitIdx;
        
        query = db.queryBuilder().insert(upsertData).into('invest_summary_date');
      } else {
        query = db.queryBuilder()
          .update(upsertData)
          .from('invest_summary_date')
          .where('summary_idx', summaryIdx);
      }

      await db.execute(query, trx ?? null);
    } catch (err) {
      throw err;
    }
  };
  
  /**
   * 전체 요약 데이터 insert/update
   * @param {number} itemIdx 상품 IDX
   * @param {number} unitIdx 단위 IDX
   * @param {Knex.Transaction} [trx] DB 트랜잭션
   * @return {Promise<void>}
   */
  const upsertTotalSummary = async (itemIdx, unitIdx, trx) => {
    //check data
    const hasItem = await db.exists(db.queryBuilder()
      .from('invest_item')
      .where('item_idx', itemIdx)
    );
    if (!hasItem) return;
    const hasUnit = await db.exists(db.queryBuilder()
      .from('invest_unit_set')
      .where('item_idx', itemIdx)
      .andWhere('unit_idx', unitIdx)
    );
    if (!hasUnit) return;
    
    //set vars: 쿼리 빌더
    let query;
    
    try {
      //set vars: insert/update 할 데이터
      const upsertData = {
        'inout_total': 0,
        'inout_principal': 0,
        'inout_proceeds': 0,
        'revenue_total': 0,
        'revenue_interest': 0,
        'revenue_eval': 0,
        'earn': 0,
        'earn_rate': 0,
        'earn_inc_proceeds': 0,
        'earn_rate_inc_proceeds': 0,
      };
      
      //set vars: 마지막 연간 데이터
      query = db.queryBuilder()
        .select()
        .from('invest_summary_date')
        .where('summary_type', 'year')
        .andWhere('item_idx', itemIdx)
        .andWhere('unit_idx', unitIdx)
        .orderBy('summary_date', 'desc');
      const rsSummary = await db.queryRow(query, trx ?? null);
  
      //생성할 요약 데이터에 가져온 데이터 저장
      if (rsSummary) {
        upsertData.inout_total = rsSummary.inout_total;
        upsertData.inout_principal = rsSummary.inout_principal_total;
        upsertData.inout_proceeds = rsSummary.inout_proceeds_total;
        
        upsertData.revenue_total = rsSummary.revenue_total;
        upsertData.revenue_interest = rsSummary.revenue_interest_total;
        upsertData.revenue_eval = rsSummary.revenue_eval;
        
        upsertData.earn = rsSummary.earn;
        upsertData.earn_rate = rsSummary.earn_rate;
        upsertData.earn_inc_proceeds = rsSummary.earn_inc_proceeds;
        upsertData.earn_rate_inc_proceeds = rsSummary.earn_rate_inc_proceeds;
      }
  
      //set vars: 요약 데이터 존재 유무
      query = db.queryBuilder()
        .from('invest_summary')
        .where('item_idx', itemIdx)
        .andWhere('unit_idx', unitIdx);
      const hasSummary = await db.exists(query, trx ?? null);
  
      // 요약 데이터 존재 유무에 따라 insert/update 처리
      if (!hasSummary) {
        upsertData['item_idx'] = itemIdx;
        upsertData['unit_idx'] = unitIdx;
        
        query = db.queryBuilder().insert(upsertData).into('invest_summary');
      } else {
        query = db.queryBuilder()
          .update(upsertData)
          .from('invest_summary')
          .where('item_idx', itemIdx)
          .andWhere('unit_idx', unitIdx);
      }
      
      await db.execute(query, trx ?? null);
    } catch (err) {
      throw err;
    }
  };
  
  /**
   * 지정 날짜 이후의 월간 요약 데이터 update
   * @param {number} itemIdx 상품 IDX
   * @param {string} date 날짜
   * @param {number} unitIdx 단위 IDX
   * @param {Knex.Transaction} [trx] DB 트랜잭션
   * @return {Promise<void>}
   */
  const updateBeforeMonthSummary = async (itemIdx, date, unitIdx, trx) => {
    //set vars: 날짜 관련
    const targetDate = date ? dayjs(date) : dayjs();
    const summaryDate = targetDate.format('YYYY-MM-01');
  
    //check data
    const hasItem = await db.exists(db.queryBuilder()
      .from('invest_item')
      .where('item_idx', itemIdx)
    );
    if (!hasItem) return;
    const hasUnit = await db.execute(db.queryBuilder()
      .from('invest_unit_set')
      .where('item_idx', itemIdx)
      .andWhere('unit_idx', unitIdx)
    );
    if (!hasUnit) return;
  
    //set vars: 쿼리 빌더
    let query;
    
    //set vars: 요약 데이터 만들 기간 범위
    query = `
      SELECT
        MIN(summary_date) AS minDate,
        MAX(summary_date) AS maxDate
      FROM invest_summary_date
      WHERE
        summary_type = 'month'
        AND summary_date > :summaryDate
        AND item_idx = :itemIdx
        AND unit_idx = :unitIdx
    `;
    let rsDateRange = await db.executeRaw(query, {itemIdx, unitIdx, summaryDate}, trx ?? null);
    if (rsDateRange.length == 0) return;
    
    rsDateRange = rsDateRange[0];
    if (!rsDateRange['minDate'] || !rsDateRange['maxDate']) return;
    
    const minDate = dayjs(rsDateRange['minDate']);
    const maxDate = dayjs(rsDateRange['maxDate']);
    
    let loopDate = minDate;
    while (loopDate <= maxDate) {
      //월간 요약 데이터 갱신
      await upsertMonthSummary(itemIdx, loopDate.format('YYYY-MM-DD'), unitIdx, trx ?? null);
  
      loopDate = loopDate.add(1, 'month');
    }
  }
  
  /**
   * 지정 날짜 이후의 년간 요약 데이터 update
   * @param {number} itemIdx 상품 IDX
   * @param {string} date 날짜
   * @param {number} unitIdx 단위 IDX
   * @param {Knex.Transaction} [trx] DB 트랜잭션
   * @return {Promise<void>}
   */
  const updateBeforeYearSummary = async (itemIdx, date, unitIdx, trx) => {
    //set vars: 날짜 관련
    const targetDate = date ? dayjs(date) : dayjs();
    const summaryDate = targetDate.format('YYYY-01-01');
    
    //check data
    const hasItem = await db.exists(db.queryBuilder()
      .from('invest_item')
      .where('item_idx', itemIdx)
    );
    if (!hasItem) return;
    const hasUnit = await db.execute(db.queryBuilder()
      .from('invest_unit_set')
      .where('item_idx', itemIdx)
      .andWhere('unit_idx', unitIdx)
    );
    if (!hasUnit) return;
    
    //set vars: 쿼리 빌더
    let query;
    
    //set vars: 요약 데이터 만들 기간 범위
    query = `
      SELECT
        MIN(summary_year) AS minYear,
        MAX(summary_year) AS maxYear
      FROM invest_summary_date
      WHERE
        summary_type = 'year'
        AND summary_date > :summaryDate
        AND item_idx = :itemIdx
        AND unit_idx = :unitIdx
    `;
    let rsYearRange = await db.executeRaw(query, {itemIdx, unitIdx, summaryDate}, trx ?? null);
    if (rsYearRange.length == 0) return;
  
    rsYearRange = rsYearRange[0];
    if (!rsYearRange['minYear'] || !rsYearRange['maxYear']) return;
    
    const minYear = rsYearRange['minYear'];
    const maxYear = rsYearRange['maxYear'];
    
    for (let year = minYear; year <= maxYear; year++) {
      await upsertYearSummary(itemIdx, `${year}-01-01`, unitIdx, trx ?? null);
    }
  }
  
  return {
    itemTypeList,
    historyTypeList,
    inoutTypeList,
    revenueTypeList,
    upsertMonthSummary,
    upsertYearSummary,
    upsertTotalSummary,
    upsertSummary,
    updateBeforeMonthSummary,
    updateBeforeYearSummary,
  }
}