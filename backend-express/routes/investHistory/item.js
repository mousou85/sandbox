//load express module
const express = require('express');
const {asyncHandler, createResult, ResponseError} = require('#helpers/expressHelper');
const authTokenMiddleware = require('#middlewares/authenticateToken');

/**
 * @param {Mysql} db
 * @return {Router}
 */
module.exports = (db) => {
  //load invest history helpers
  const investHistoryHelper = require('#helpers/investHistoryHelper')(db);
  
  //set vars: router
  const router = express.Router();
  
  //set vars: invest history const
  const itemTypeList = investHistoryHelper.itemTypeList;
  
  /**
   * item type 리스트
   */
  router.get('/item-type', authTokenMiddleware, asyncHandler(async (req, res) => {
    let list = [];
    for (let key in itemTypeList) {
      list.push({type: key, text: itemTypeList[key]});
    }
    
    res.json(createResult('success', {'list': list}));
  }));
  
  /**
   * item 목록
   */
  router.get('/', authTokenMiddleware, asyncHandler(async (req, res) => {
    try {
      //set vars: user idx
      const userIdx = req.user.user_idx;
      
      //set vars: request
      let listType = req.query.type ?? '';
      
      let query;
      let list = [];
      
      if (listType == 'group') {
        //set vars: 기업 목록
        query = db.queryBuilder()
          .select(['company_idx', 'company_name'])
          .from('invest_company')
          .where('user_idx', userIdx)
          .orderBy('company_name', 'desc');
        let rsCompanyList = await db.queryAll(query);
        
        //기업단위로 상품 목록 구성
        for (const company of rsCompanyList) {
          let _tmp1 = {
            company_idx: company.company_idx,
            company_name: company.company_name,
            item_count: 0,
            item_list: []
          };
          
          //set vars: 아이템 목록
          query = db.queryBuilder()
            .select()
            .from('invest_item')
            .where('company_idx', company.company_idx)
            .orderBy('item_name', 'asc');
          let rsItemList = await db.queryAll(query);
          
          for (const item of rsItemList) {
            let _tmp2 = {
              item_idx: item.item_idx,
              item_name: item.item_name,
              item_type: item.item_type,
              item_type_text: itemTypeList[item.item_type],
              is_close: item.is_close != 'n',
              closed_at: item.closed_at,
              unit_set: []
            }
            
            //단위 목록 세팅
            query = db.queryBuilder()
              .select(['us.unit_idx', 'u.unit', 'u.unit_type'])
              .from('invest_unit_set AS us')
              .join('invest_unit AS u', 'us.unit_idx', 'u.unit_idx')
              .where('us.item_idx', item.item_idx)
              .orderBy('us.unit_set_idx', 'asc');
            _tmp2.unit_set = await db.queryAll(query);
            
            _tmp1.item_count++;
            _tmp1.item_list.push(_tmp2);
          }
          
          list.push(_tmp1);
        }
      } else {
        //set vars: 데이터
        list = await db.queryAll(db.queryBuilder()
          .select(db.raw('i.*, ic.company_name'))
          .from('invest_item AS i')
          .join('invest_company AS ic', 'i.company_idx', 'ic.company_idx')
          .where('ic.user_idx', userIdx)
          .orderBy([
            {column: 'ic.company_name', order: 'asc'},
            {column: 'i.item_name', order: 'asc'}
          ])
        );
        for (let i in list) {
          let _itemIdx = list[i].item_idx;
    
          list[i].item_type_text = itemTypeList[list[i].item_type];
          list[i].unit_set = await db.queryAll(db.queryBuilder()
            .select(['us.unit_idx', 'u.unit', 'u.unit_type'])
            .from('invest_unit_set AS us')
            .join('invest_unit AS u', 'us.unit_idx', 'u.unit_idx')
            .where('us.item_idx', _itemIdx)
            .orderBy('us.unit_set_idx', 'asc')
          );
        }
      }
      
      res.json(createResult('success', {list: list}));
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * item 데이터
   */
  router.get('/:item_idx', authTokenMiddleware, asyncHandler(async (req, res) => {
    try {
      //set vars: user idx
      const userIdx = req.user.user_idx;
      
      //set vars: request
      let itemIdx = req.params.item_idx;
      if (!itemIdx) throw new ResponseError('잘못된 접근');
      
      //set vars: 데이터
      let rsItem = await db.queryRow(db.queryBuilder()
        .select(db.raw('i.*, c.company_name'))
        .from('invest_item AS i')
        .join('invest_company AS c', 'i.company_idx', 'c.company_idx')
        .where('i.item_idx', itemIdx)
        .andWhere('c.user_idx', userIdx)
      );
      if (!rsItem) throw new ResponseError('데이터 없음');
  
      rsItem.unit_set = await db.queryAll(db.queryBuilder()
        .select(db.raw('us.*, u.unit, u.unit_type'))
        .from('invest_unit_set AS us')
        .join('invest_unit AS u', 'us.unit_idx', 'u.unit_idx')
        .where('us.item_idx', itemIdx)
        .orderBy('us.unit_set_idx', 'asc')
      );
      
      res.json(createResult('success', rsItem));
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * item 등록
   */
  router.post('/', authTokenMiddleware, asyncHandler(async (req, res) => {
    try {
      //set vars: user idx
      const userIdx = req.user.user_idx;
      
      //set vars: request
      let companyIdx = req.body.company_idx;
      let itemType = req.body.item_type;
      let itemName = req.body.item_name;
      let units = req.body.units;
      itemName = itemName ? itemName.trim() : null;
      if (!companyIdx) throw new ResponseError('company_idx는 필수입력임');
      if (!itemType) throw new ResponseError('item_type는 필수입력임');
      if (!itemName) throw new ResponseError('item_name는 필수입력임');
      if (!itemTypeList.hasOwnProperty(itemType)) throw new ResponseError('존재하지 않는 item type임');
      if (itemName.length > 50) throw new ResponseError('item_name은 50자 이하로 입력');
      
      //check data
      let hasCompany = await db.exists(db.queryBuilder()
        .from('invest_company')
        .where('company_idx', companyIdx)
        .andWhere('user_idx', userIdx)
      );
      if (!hasCompany) throw new ResponseError('company가 존재하지 않음');
      
      //insert data
      const trx = await db.transaction();
      try {
        //item 등록
        let itemIdx = await db.execute(db.queryBuilder()
          .insert({'company_idx': companyIdx, 'item_type': itemType, 'item_name': itemName})
          .into('invest_item')
        , trx);
        if (!itemIdx) throw new ResponseError('item 추가 실패함');
        
        //unit set 등록
        if (units && units.length) {
          for (let unit of units) {
            let hasUnit = await db.exists(db.queryBuilder()
              .from('invest_unit')
              .where('unit_idx', unit)
              .andWhere('user_idx', userIdx)
            , trx);
            if (!hasUnit) throw new ResponseError('unit이 존재하지 않음');
            
            await db.execute(db.queryBuilder()
              .insert({'item_idx': itemIdx, 'unit_idx': unit})
              .into('invest_unit_set')
            , trx);
          }
        }
        
        await trx.commit();
      } catch (err) {
        await trx.rollback();
        throw err;
      }
      
      res.json(createResult());
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * item 수정
   */
  router.put('/:item_idx', authTokenMiddleware, asyncHandler(async (req, res) => {
    try {
      //set vars: user idx
      const userIdx = req.user.user_idx;
      
      //set vars: request
      let itemIdx = req.params.item_idx;
      let companyIdx = req.body.company_idx;
      let itemType = req.body.item_type;
      let itemName = req.body.item_name;
      let units = req.body.units;
      itemName = itemName ? itemName.trim() : null;
      if (!companyIdx && !itemType && !itemName && (!units || !units.length)) throw new ResponseError('잘못된 접근');
      
      //check data
      let hasData = await db.exists(db.queryBuilder()
        .from('invest_item AS ii')
        .join('invest_company AS ic', 'ii.company_idx', 'ic.company_idx')
        .where('ii.item_idx', itemIdx)
        .andWhere('ic.user_idx', userIdx)
      );
      if (!hasData) throw new ResponseError('데이터가 존재하지 않음');
      
      /*
       update data
       */
      let updateParams = {};
      
      if (companyIdx) {
        let hasCompany = await db.exists(db.queryBuilder()
          .from('invest_company')
          .where('company_idx', companyIdx)
          .andWhere('user_idx', userIdx)
        );
        if (!hasCompany) throw new ResponseError('company가 존재하지 않음');
        
        updateParams.company_idx = companyIdx;
      }
      if (itemType) {
        if (!itemTypeList.hasOwnProperty(itemType)) throw new ResponseError('존재하지 않는 item type임');
        
        updateParams.item_type = itemType;
      }
      if (itemName) {
        if (itemName.length > 50) throw new ResponseError('item_name은 50자 이하로 입력');
        
        updateParams.item_name = itemName;
      }
      
      const trx = await db.transaction();
      try {
        //update
        if (Object.keys(updateParams).length) {
          await db.execute(db.queryBuilder()
            .update(updateParams)
            .from('invest_item')
            .where('item_idx', itemIdx)
          , trx);
        }
        
        //unit-set update
        if (units && units.length) {
          let rsUnitSetList = await db.queryAll(db.queryBuilder()
            .select(['unit_set_idx', 'unit_idx'])
            .from('invest_unit_set')
            .where('item_idx', itemIdx)
          , trx);
          
          for (let item of rsUnitSetList) {
            //기존 등록 unit 중 삭제해야될 것들 삭제
            if (!units.includes(item.unit_idx)) {
              await db.execute(db.queryBuilder()
                .delete()
                .from('invest_unit_set')
                .where('unit_set_idx', item.unit_set_idx)
              , trx);
            } else {
              units.splice(units.indexOf(item.unit_idx), 1);
            }
          }
          
          for (let unit of units) {
            //unit 데이터 유무 체크
            let hasUnit = await db.exists(db.queryBuilder()
              .from('invest_unit')
              .where('unit_idx', unit)
              .andWhere('user_idx', userIdx)
            );
            if (!hasUnit) throw new ResponseError('선택한 unit의 데이터가 존재하지 않음');
            
            await db.execute(db.queryBuilder()
              .insert({'item_idx': itemIdx, 'unit_idx': unit})
              .into('invest_unit_set')
            , trx);
          }
        }
        
        await trx.commit();
      } catch (err) {
        await trx.rollback();
        throw err;
      }
      
      res.json(createResult());
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * item 삭제
   */
  router.delete('/:item_idx', authTokenMiddleware, asyncHandler(async (req, res) => {
    try {
      //set vars: user idx
      const userIdx = req.user.user_idx;
      
      //set vars: request
      let itemIdx = req.params.item_idx;
      
      //check data
      let hasData = await db.exists(db.queryBuilder()
        .from('invest_item AS ii')
        .join('invest_company AS ic', 'ii.company_idx', 'ic.company_idx')
        .where('ii.item_idx', itemIdx)
        .andWhere('ic.user_idx', userIdx)
      );
      if (!hasData) throw new ResponseError('데이터가 존재하지 않음');
      
      let hasHistory = await db.queryScalar(db.queryBuilder()
        .from('invest_history')
        .where('item_idx', itemIdx)
      );
      if (hasHistory) throw new ResponseError('history가 있는 item은 삭제 불가');
      
      /*
       delete data
       */
      const trx = await db.transaction();
      try {
        await db.execute(db.queryBuilder()
          .delete()
          .from('invest_unit_set')
          .where('item_idx', itemIdx)
        , trx);
        
        await db.execute(db.queryBuilder()
          .delete()
          .from('invest_item')
          .where('item_idx', itemIdx)
        , trx);
        
        await trx.commit();
      } catch (err) {
        await trx.rollback();
        throw err;
      }
      
      res.json(createResult());
    } catch (err) {
      throw err;
    }
  }));
  
  return router;
}