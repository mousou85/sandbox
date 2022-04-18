const express = require('express');
const asyncHandler = require('#helper/express-async-wrap');
const {ResponseError, createResult} = require('#helper/express-response');
const dayjs = require("dayjs");

/**
 * @param {Mysql} db
 * @return {Router}
 */
module.exports = (db) => {
  const router = express.Router();
  const {
    upsertMonthSummary,
    upsertYearSummary,
    upsertTotalSummary,
  } = require('#helper/db/investHistory')(db);
  
  /**
   * summary total
   */
  router.get('/:item_idx([0-9]+)/total', asyncHandler(async (req, res) => {
    try {
      //set vars: request
      const itemIdx = req.params.item_idx;
      const unit = req.query.unit ? req.query.unit.toUpperCase() : 'KRW';
  
      if (!itemIdx) throw new ResponseError('잘못된 접근');
  
      //item 유무 체크
      const hasItem = await db.exists(db.queryBuilder()
        .from('invest_item')
        .where('item_idx', itemIdx)
      );
      if (!hasItem) throw new ResponseError('item이 존재하지 않음');
      
      //set vars: 요약 데이터
      let query = db.queryBuilder()
        .select()
        .from('invest_summary AS s')
        .join('invest_unit AS u', 's.unit_idx', 'u.unit_idx')
        .where('s.item_idx', itemIdx)
        .andWhere('u.unit', unit);
      const rsSummary = await db.queryRow(query);
  
      // set vars: summary data
      let summaryData = {
        'unit': unit,
        'unitType': '',
        'inout': {
          'total': 0,
          'principal': 0,
          'proceeds': 0,
        },
        'revenue': {
          'total': 0,
          'interest': 0,
          'eval': 0
        },
        'earn': {
          'earn': 0,
          'rate': 0.0,
          'earnIncProceeds': 0,
          'rateIncProceeds': 0
        }
      };
  
  
      if (rsSummary) {
        summaryData.unitType = rsSummary.unit_type;
        summaryData.inout.total = rsSummary.inout_total;
        summaryData.inout.principal = rsSummary.inout_principal;
        summaryData.inout.proceeds = rsSummary.inout_proceeds;
        summaryData.revenue.total = rsSummary.revenue_total;
        summaryData.revenue.interest = rsSummary.revenue_interest;
        summaryData.revenue.eval = rsSummary.revenue_eval;
        summaryData.earn.earn = rsSummary.earn;
        summaryData.earn.rate = rsSummary.earn_rate;
        summaryData.earn.earnIncProceeds = rsSummary.earn_inc_proceeds;
        summaryData.earn.rateIncProceeds = rsSummary.earn_rate_inc_proceeds;
      }
  
      res.json(createResult('success', summaryData));
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * summary month
   */
  router.get('/:item_idx([0-9]+)/month', asyncHandler(async (req, res) => {
    try {
      //set vars: request
      const itemIdx = req.params.item_idx;
      const unit = req.query.unit ? req.query.unit.toUpperCase() : 'KRW';
      const date = req.query.date ? dayjs(req.query.date) : dayjs();
      
      if (!itemIdx) throw new ResponseError('잘못된 접근');
      
      //item 유무 체크
      const hasItem = await db.exists(db.queryBuilder()
        .from('invest_item')
        .where('item_idx', itemIdx)
      );
      if (!hasItem) throw new ResponseError('item이 존재하지 않음');
      
      //set vars: summary date
      const summaryDate = date.format('YYYY-MM-01');
      
      //set vars: 요약 데이터
      let query = db.queryBuilder()
        .select()
        .from('invest_summary_month AS s')
        .join('invest_unit AS u', 's.unit_idx', 'u.unit_idx')
        .where('s.item_idx', itemIdx)
        .andWhere('s.summary_date', summaryDate)
        .andWhere('u.unit', unit);
      const rsSummary = await db.queryRow(query);
      
      // set vars: summary data
      let summaryData = {
        'year': date.format('YYYY'),
        'month': date.format('MM'),
        'unit': unit,
        'unitType': '',
        'inout': {
          'total': 0,
          'principalTotal': 0,
          'principalPrev': 0,
          'principalCurrent': 0,
          'proceedsTotal': 0,
          'proceedsPrev': 0,
          'proceedsCurrent': 0,
        },
        'revenue': {
          'total': 0,
          'interestTotal': 0,
          'interestPrev': 0,
          'interestCurrent': 0,
          'eval': 0,
          'evalPrev': 0,
        },
        'earn': {
          'earn': 0,
          'rate': 0.0,
          'earnIncProceeds': 0,
          'rateIncProceeds': 0
        },
        'earnPrevDiff': {
          'earn': 0,
          'rate': 0.0,
          'earnIncProceeds': 0,
          'rateIncProceeds': 0
        }
      };
      
      
      if (rsSummary) {
        summaryData.unitType = rsSummary.unit_type;
        
        summaryData.inout.total = rsSummary.inout_total;
        summaryData.inout.principalTotal = rsSummary.inout_principal_total;
        summaryData.inout.principalPrev = rsSummary.inout_principal_prev;
        summaryData.inout.principalCurrent = rsSummary.inout_principal_current;
        summaryData.inout.proceedsTotal = rsSummary.inout_proceeds_total;
        summaryData.inout.proceedsPrev = rsSummary.inout_proceeds_prev;
        summaryData.inout.proceedsCurrent = rsSummary.inout_proceeds_current;
  
        summaryData.revenue.total = rsSummary.revenue_total;
        summaryData.revenue.interestTotal = rsSummary.revenue_interest_total;
        summaryData.revenue.interestPrev = rsSummary.revenue_interest_prev;
        summaryData.revenue.interestCurrent = rsSummary.revenue_interest_current;
        summaryData.revenue.eval = rsSummary.revenue_eval;
        summaryData.revenue.evalPrev = rsSummary.revenue_eval_prev;
        
        summaryData.earn.earn = rsSummary.earn;
        summaryData.earn.rate = rsSummary.earn_rate;
        summaryData.earn.earnIncProceeds = rsSummary.earn_inc_proceeds;
        summaryData.earn.rateIncProceeds = rsSummary.earn_rate_inc_proceeds;
        
        summaryData.earnPrevDiff.earn = rsSummary.earn_prev_diff;
        summaryData.earnPrevDiff.rate = rsSummary.earn_rate_prev_diff;
        summaryData.earnPrevDiff.earnIncProceeds = rsSummary.earn_inc_proceeds_prev_diff;
        summaryData.earnPrevDiff.rateIncProceeds = rsSummary.earn_rate_inc_proceeds_prev_diff;
      }
      
      res.json(createResult('success', summaryData));
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * summary year
   */
  router.get('/:item_idx([0-9]+)/year', asyncHandler(async (req, res) => {
    try {
      //set vars: request
      const itemIdx = req.params.item_idx;
      const unit = req.query.unit ? req.query.unit.toUpperCase() : 'KRW';
      const year = req.query.year ?? dayjs().year();
      
      if (!itemIdx) throw new ResponseError('잘못된 접근');
      
      //item 유무 체크
      const hasItem = await db.exists(db.queryBuilder()
        .from('invest_item')
        .where('item_idx', itemIdx)
      );
      if (!hasItem) throw new ResponseError('item이 존재하지 않음');
      
      //set vars: 요약 데이터
      let query = db.queryBuilder()
        .select()
        .from('invest_summary_year AS s')
        .join('invest_unit AS u', 's.unit_idx', 'u.unit_idx')
        .where('s.item_idx', itemIdx)
        .andWhere('s.summary_year', year)
        .andWhere('u.unit', unit);
      const rsSummary = await db.queryRow(query);
      
      // set vars: summary data
      let summaryData = {
        'year': year,
        'unit': unit,
        'unitType': '',
        'inout': {
          'total': 0,
          'principalTotal': 0,
          'principalPrev': 0,
          'principalCurrent': 0,
          'proceedsTotal': 0,
          'proceedsPrev': 0,
          'proceedsCurrent': 0,
        },
        'revenue': {
          'total': 0,
          'interestTotal': 0,
          'interestPrev': 0,
          'interestCurrent': 0,
          'eval': 0,
          'evalPrev': 0,
        },
        'earn': {
          'earn': 0,
          'rate': 0.0,
          'earnIncProceeds': 0,
          'rateIncProceeds': 0
        },
        'earnPrevDiff': {
          'earn': 0,
          'rate': 0.0,
          'earnIncProceeds': 0,
          'rateIncProceeds': 0
        }
      };
      
      
      if (rsSummary) {
        summaryData.unitType = rsSummary.unit_type;
        
        summaryData.inout.total = rsSummary.inout_total;
        summaryData.inout.principalTotal = rsSummary.inout_principal_total;
        summaryData.inout.principalPrev = rsSummary.inout_principal_prev;
        summaryData.inout.principalCurrent = rsSummary.inout_principal_current;
        summaryData.inout.proceedsTotal = rsSummary.inout_proceeds_total;
        summaryData.inout.proceedsPrev = rsSummary.inout_proceeds_prev;
        summaryData.inout.proceedsCurrent = rsSummary.inout_proceeds_current;
        
        summaryData.revenue.total = rsSummary.revenue_total;
        summaryData.revenue.interestTotal = rsSummary.revenue_interest_total;
        summaryData.revenue.interestPrev = rsSummary.revenue_interest_prev;
        summaryData.revenue.interestCurrent = rsSummary.revenue_interest_current;
        summaryData.revenue.eval = rsSummary.revenue_eval;
        summaryData.revenue.evalPrev = rsSummary.revenue_eval_prev;
        
        summaryData.earn.earn = rsSummary.earn;
        summaryData.earn.rate = rsSummary.earn_rate;
        summaryData.earn.earnIncProceeds = rsSummary.earn_inc_proceeds;
        summaryData.earn.rateIncProceeds = rsSummary.earn_rate_inc_proceeds;
        
        summaryData.earnPrevDiff.earn = rsSummary.earn_prev_diff;
        summaryData.earnPrevDiff.rate = rsSummary.earn_rate_prev_diff;
        summaryData.earnPrevDiff.earnIncProceeds = rsSummary.earn_inc_proceeds_prev_diff;
        summaryData.earnPrevDiff.rateIncProceeds = rsSummary.earn_rate_inc_proceeds_prev_diff;
      }
      
      res.json(createResult('success', summaryData));
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * summary remake
   */
  router.get('/remake-all', asyncHandler(async (req, res) => {
    try {
      //set vars: 상품 목록
      const itemList = await db.queryAll(db.queryBuilder()
          .select('item_idx')
          .from('invest_item')
        );
      
      //상품별로 처리
      for (const item of itemList) {
        const _itemIdx = item.item_idx;
        
        //set vars: 단위 리스트
        const unitList = await db.queryAll(db.queryBuilder()
            .select('unit_idx')
            .from('invest_unit_set')
            .where('item_idx', _itemIdx)
          );
        
        //단위별로 처리
        for (const unit of unitList) {
          const _unitIdx = unit.unit_idx;
          
          //set vars: 요약 데이터 만들 기간 범위
          const rsDateRange = await db.queryRow(db.queryBuilder()
              .select([
                db.raw(`DATE_FORMAT(MIN(history_date), '%Y-%m-01') AS minDate`),
                db.raw(`DATE_FORMAT(MAX(history_date), '%Y-%m-01') AS maxDate`)
              ])
              .from('invest_history')
              .where('item_idx', _itemIdx)
              .andWhere('unit_idx', _unitIdx)
            );
          if (!rsDateRange.minDate || !rsDateRange.maxDate) continue;
  
          const _minDate = dayjs(rsDateRange.minDate);
          const _maxDate = dayjs(rsDateRange.maxDate);
  
          //기간 범위를 1달 단위로 반복하며 처리
          let _targetDate = _minDate;
          let _lastYear = _minDate.year();
          let _summaryYear = [_lastYear];
          while (_targetDate <= _maxDate) {
            //월간 요약 데이터 생성
            await upsertMonthSummary(_itemIdx, _targetDate.format('YYYY-MM-DD'), _unitIdx);
    
            _targetDate = _targetDate.add(1, 'month');
            if (_lastYear != _targetDate.year()) {
              _lastYear = _targetDate.year();
              _summaryYear.push(_lastYear);
            }
          }
  
          //년간 요약 데이터 생성
          for (const year of _summaryYear) {
            await upsertYearSummary(_itemIdx, `${year}-12-01`, _unitIdx);
          }
  
          //전체 요약 데이터 생성
          await upsertTotalSummary(_itemIdx, _unitIdx);
        }
      }
      
      res.json(createResult('success'));
    } catch (err) {
      throw err;
    }
  }));
  
  router.get('/test', asyncHandler(async (req, res) => {
    try {
      const itemIdx = 17;
      const unitIdx = 3;
      const historyDate = '2022-01-01';
      
      await upsertMonthSummary(itemIdx, historyDate, unitIdx);
      
      res.json(createResult());
    } catch (err) {
      throw err;
    }
  }));
  
  return router;
}