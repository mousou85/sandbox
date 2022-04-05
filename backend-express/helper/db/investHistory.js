const dayjs = require('dayjs');

/**
 *
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
      await upsertYearSummary(itemIdx, date, unitIdx, trx);
      await upsertTotalSummary(itemIdx, unitIdx, trx);
    } catch (err) {
      throw err;
    }
  }
  
  /**
   * 월간 요약 데이터 insert/update
   * @param {number} itemIdx 상품 IDX
   * @param {string} date 날짜
   * @param {number} unixIdx 단위 IDX
   * @param {Knex.Transaction} [trx] DB 트랜잭션
   * @return {Promise<void>}
   */
  const upsertMonthSummary = async (itemIdx, date, unixIdx, trx) => {
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
        .andWhere('unit_idx', unixIdx)
      );
    if (!hasUnit) return;
    
    //set vars: 쿼리 빌더
    let query;
    
    try {
      //set vars: insert/update 할 데이터
      const upsertData = {
        'in_principal': 0,
        'in_proceeds': 0,
        'out_principal': 0,
        'out_proceeds': 0,
        'revenue_interest': 0,
        'revenue_eval': 0
      };
  
      // 유입/유출/평가(이자) 요약 데이터 생성
      query = db.queryBuilder()
        .select(db.raw(`
          history_type,
          CASE
            WHEN history_type in ('in', 'out') THEN inout_type
            WHEN history_type = 'revenue' THEN revenue_type
          END AS val_type,
          SUM(val) AS totalVal
        `))
        .from('invest_history')
        .where('item_idx', itemIdx)
        .andWhere('unit_idx', unixIdx)
        .andWhere('history_date', '>=', startDate)
        .andWhere('history_date', '<=', endDate)
        .andWhere(builder => {
          builder.whereIn('history_type', ['in', 'out'])
            .orWhereRaw(`(history_type = 'revenue' AND revenue_type = 'interest')`);
        })
        .groupBy(['history_type', 'val_type']);
      let rsSummary = await db.queryAll(query, trx ?? null);
      for (const summary of rsSummary) {
        let column = `${summary.history_type}_${summary.val_type}`;
        upsertData[column] = summary.totalVal;
      }
  
      // 평가(평가금액) 요약 데이터 생성
      query = db.queryBuilder()
        .select('val')
        .from('invest_history')
        .where('item_idx', itemIdx)
        .andWhere('unit_idx', unixIdx)
        .andWhere('history_date', '<=', endDate)
        .andWhere('history_type', 'revenue')
        .andWhere('revenue_type', 'eval')
        .orderBy([
          {column: 'history_date', order: 'desc'},
          {column: 'history_idx', order: 'desc'}
        ])
        .limit(1);
      rsSummary = await db.queryRow(query, trx ?? null);
      if (rsSummary) upsertData['revenue_eval'] = rsSummary.val;
  
      // 요약 데이터 insert/update 처리
      query = db.queryBuilder()
        .from('invest_summary_month')
        .where('item_idx', itemIdx)
        .andWhere('unit_idx', unixIdx)
        .andWhere('summary_date', summaryDate);
      if (await db.exists(query, trx ?? null)) {
        query = db.queryBuilder()
          .update(upsertData)
          .from('invest_summary_month')
          .where('item_idx', itemIdx)
          .andWhere('unit_idx', unixIdx)
          .andWhere('summary_date', summaryDate);
      } else {
        upsertData['summary_date'] = summaryDate;
        upsertData['item_idx'] = itemIdx;
        upsertData['unit_idx'] = unixIdx;
    
        query = db.queryBuilder()
          .insert(upsertData)
          .into('invest_summary_month');
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
    const summaryYear = targetDate.format('YYYY');
  
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
        'in_principal': 0,
        'in_proceeds': 0,
        'out_principal': 0,
        'out_proceeds': 0,
        'revenue_interest': 0,
        'revenue_eval': 0
      };
    
      //유입/유출/평가(이자) 요약 데이터 생성
      query = db.queryBuilder()
        .sum('in_principal AS in_principal')
        .sum('in_proceeds AS in_proceeds')
        .sum('out_principal AS out_principal')
        .sum('out_proceeds AS out_proceeds')
        .sum('revenue_interest AS revenue_interest')
        .from('invest_summary_month')
        .where('item_idx', itemIdx)
        .andWhere('unit_idx', unitIdx)
        .andWhere('summary_date', '>=', startDate)
        .andWhere('summary_date', '<=', endDate);
      let rsSummary = await db.queryRow(query, trx ?? null);
      if (rsSummary) {
        for (const key of Object.keys(rsSummary)) {
          upsertData[key] = rsSummary[key] ?? 0;
        }
      }

      // 평가(평가금액) 요약 데이터 생성
      query = db.queryBuilder()
        .select('revenue_eval')
        .from('invest_summary_month')
        .where('item_idx', itemIdx)
        .andWhere('unit_idx', unitIdx)
        .andWhere('summary_date', '>=', startDate)
        .andWhere('summary_date', '<=', endDate)
        .orderBy('summary_date', 'desc')
        .limit(1);
      rsSummary = await db.queryRow(query, trx ?? null);
      if (rsSummary) {
        upsertData.revenue_eval = rsSummary.revenue_eval ?? 0;
      }
    
      // 요약 데이터 insert/update 처리
      query = db.queryBuilder()
        .from('invest_summary_year')
        .where('item_idx', itemIdx)
        .andWhere('unit_idx', unitIdx)
        .andWhere('summary_year', summaryYear);
      if (await db.exists(query, trx ?? null)) {
        query = db.queryBuilder()
          .update(upsertData)
          .from('invest_summary_year')
          .where('item_idx', itemIdx)
          .andWhere('unit_idx', unitIdx)
          .andWhere('summary_year', summaryYear);
      } else {
        upsertData['summary_year'] = summaryYear;
        upsertData['item_idx'] = itemIdx;
        upsertData['unit_idx'] = unitIdx;
      
        query = db.queryBuilder()
          .insert(upsertData)
          .into('invest_summary_year');
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
        'in_principal': 0,
        'in_proceeds': 0,
        'out_principal': 0,
        'out_proceeds': 0,
        'revenue_interest': 0,
        'revenue_eval': 0
      };
      
      //유입/유출/평가(이자) 요약 데이터 생성
      query = db.queryBuilder()
        .sum('in_principal AS in_principal')
        .sum('in_proceeds AS in_proceeds')
        .sum('out_principal AS out_principal')
        .sum('out_proceeds AS out_proceeds')
        .sum('revenue_interest AS revenue_interest')
        .from('invest_summary_year')
        .where('item_idx', itemIdx)
        .andWhere('unit_idx', unitIdx);
      let rsSummary = await db.queryRow(query, trx ?? null);
      if (rsSummary) {
        for (const key of Object.keys(rsSummary)) {
          upsertData[key] = rsSummary[key] ?? 0;
        }
      }

      // 평가(평가금액) 요약 데이터 생성
      query = db.queryBuilder()
        .select('revenue_eval')
        .from('invest_summary_year')
        .where('item_idx', itemIdx)
        .andWhere('unit_idx', unitIdx)
        .orderBy('summary_year', 'desc')
        .limit(1);
      rsSummary = await db.queryRow(query, trx ?? null);
      if (rsSummary) {
        upsertData.revenue_eval = rsSummary.revenue_eval ?? 0;
      }
      
      // 요약 데이터 insert/update 처리
      query = db.queryBuilder()
        .from('invest_summary')
        .where('item_idx', itemIdx)
        .andWhere('unit_idx', unitIdx);
      if (await db.exists(query, trx ?? null)) {
        query = db.queryBuilder()
          .update(upsertData)
          .from('invest_summary')
          .where('item_idx', itemIdx)
          .andWhere('unit_idx', unitIdx);
      } else {
        upsertData['item_idx'] = itemIdx;
        upsertData['unit_idx'] = unitIdx;
        
        query = db.queryBuilder()
          .insert(upsertData)
          .into('invest_summary');
      }
      
      await db.execute(query, trx ?? null);
    } catch (err) {
      throw err;
    }
  };
  
  return {
    itemTypeList,
    historyTypeList,
    inoutTypeList,
    revenueTypeList,
    upsertMonthSummary,
    upsertYearSummary,
    upsertTotalSummary,
    upsertSummary
  }
}