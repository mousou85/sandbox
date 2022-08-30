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
    
    res.json(createResult({list: list}));
  }));
  
  /**
   * item 목록
   */
  router.get('/', authTokenMiddleware, asyncHandler(async (req, res) => {
    //set vars: user idx
    const userIdx = req.user.user_idx;
  
    //set vars: 데이터
    let list = await db.queryAll(db.queryBuilder()
      .select(['igi.group_idx', 'ii.item_idx', 'ii.item_type', 'ii.item_name', 'ii.is_close', 'ii.closed_at'])
      .from('invest_item AS ii')
      .leftJoin('invest_group_item AS igi', 'ii.item_idx', 'igi.item_idx')
      .where('ii.user_idx', userIdx)
      .orderBy('ii.item_idx', 'asc')
    );
    for (let i in list) {
      let _item = list[i];
    
      _item.item_type_text = itemTypeList[_item.item_type];
      _item.unit_list = await db.queryAll(db.queryBuilder()
        .select(['ius.unit_idx', 'iu.unit', 'iu.unit_type'])
        .from('invest_unit_set AS ius')
        .join('invest_unit AS iu', 'ius.unit_idx', 'iu.unit_idx')
        .where('ius.item_idx', _item.item_idx)
        .orderBy('ius.unit_set_idx', 'asc')
      );
      
      list[i] = _item;
    }
  
    res.json(createResult({list: list}));
  }));
  
  /**
   * item 데이터
   */
  router.get('/:item_idx([0-9]+)', authTokenMiddleware, asyncHandler(async (req, res) => {
    try {
      //set vars: user idx
      const userIdx = req.user.user_idx;
      
      //set vars: request
      const itemIdx = req.params.item_idx;
      
      //set vars: 데이터
      let rsItem = await db.queryRow(db.queryBuilder()
        .select(['item_idx', 'item_type', 'item_name', 'is_close', 'closed_at'])
        .from('invest_item')
        .where('item_idx', itemIdx)
        .andWhere('user_idx', userIdx)
      );
      if (!rsItem) throw new ResponseError('데이터 없음');
  
      rsItem.item_type_text = itemTypeList[rsItem.item_type];
      rsItem.unit_list = await db.queryAll(db.queryBuilder()
        .select(['ius.unit_idx', 'iu.unit', 'iu.unit_type'])
        .from('invest_unit_set AS ius')
        .join('invest_unit AS iu', 'ius.unit_idx', 'iu.unit_idx')
        .where('ius.item_idx', rsItem.item_idx)
        .orderBy('ius.unit_set_idx', 'asc')
      );
      
      res.json(createResult(rsItem));
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * item 등록
   */
  router.post('/', authTokenMiddleware, asyncHandler(async (req, res) => {
    //set vars: user idx
    const userIdx = req.user.user_idx;
  
    //set vars: request
    let groupIdx = req.body.group_idx ?? 0;
    let itemType = req.body.item_type ? req.body.item_type.trim() : '';
    let itemName = req.body.item_name ? req.body.item_name.trim() : '';
    if (!groupIdx) throw new ResponseError('group_idx 필수입력임');
    if (!itemType) throw new ResponseError('item_type 필수입력임');
    if (!itemName) throw new ResponseError('item_name 필수입력임');
    if (!itemTypeList.hasOwnProperty(itemType)) throw new ResponseError('존재하지 않는 item type');
    if (itemName.length > 50) throw new ResponseError('item_name 50자 이하로 입력');
  
    //check data
    let hasGroup = await db.exists(db.queryBuilder()
      .from('invest_group')
      .where('group_idx', groupIdx)
      .andWhere('user_idx', userIdx)
    );
    if (!hasGroup) throw new ResponseError('group 존재하지 않음');
  
    /*
     * insert data
     */
    const dbTrx = await db.transaction();
    let itemIdx = null;
    try {
      //insert item
      itemIdx = await db.execute(db.queryBuilder()
        .insert({user_idx: userIdx, item_type: itemType, item_name: itemName})
        .into('invest_item')
      , dbTrx);
      if (!itemIdx) throw new ResponseError('item 추가 실패함');
  
      //insert group item
      await db.execute(db.queryBuilder()
        .insert({group_idx: groupIdx, item_idx: itemIdx})
        .into('invest_group_item')
      , dbTrx);
      
      await dbTrx.commit();
    } catch (err) {
      await dbTrx.rollback();
      throw err;
    }
  
    res.json(createResult({item_idx: itemIdx}));
  }));
  
  /**
   * item 수정
   */
  router.put('/:item_idx([0-9]+)', authTokenMiddleware, asyncHandler(async (req, res) => {
    //set vars: user idx
    const userIdx = req.user.user_idx;
  
    //set vars: request
    const itemIdx = req.params.item_idx;
    let groupIdx = req.body.group_idx ?? 0;
    let itemType = req.body.item_type ? req.body.item_type.trim() : '';
    let itemName = req.body.item_name ? req.body.item_name.trim() : '';
    if (itemType && !itemTypeList.hasOwnProperty(itemType)) throw new ResponseError('존재하지 않는 item type');
    if (itemName && itemName.length > 50) throw new ResponseError('item_name 50자 이하로 입력');
  
    //check data
    let hasData = await db.exists(db.queryBuilder()
      .from('invest_item')
      .where('item_idx', itemIdx)
      .andWhere('user_idx', userIdx)
    );
    if (!hasData) throw new ResponseError('데이터가 존재하지 않음');
  
    /*
     * update data
     */
    const dbTrx = await db.transaction();
    try {
      //set vars: update data
      let updateParams = {};
      if (itemType) updateParams.item_type = itemType;
      if (itemName) updateParams.item_name = itemName;
    
      //update item
      if (Object.keys(updateParams).length) {
        await db.execute(db.queryBuilder()
          .update(updateParams)
          .from('invest_item')
          .where('item_idx', itemIdx)
        , dbTrx);
      }
    
      //update group
      if (groupIdx) {
        let hasGroup = await db.exists(db.queryBuilder()
          .from('invest_group')
          .where('group_idx', groupIdx)
          .andWhere('user_idx', userIdx)
        );
        if (!hasGroup) throw new ResponseError('group 존재하지 않음');
        
        let hasGroupItem = await db.exists(db.queryBuilder()
          .from('invest_group_item')
          .where('item_idx', itemIdx)
        );
        
        if (hasGroupItem) {
          await db.execute(db.queryBuilder()
            .update({group_idx: groupIdx})
            .from('invest_group_item')
            .where('item_idx', itemIdx)
          , dbTrx);
        } else {
          await db.execute(db.queryBuilder()
            .insert({group_idx: groupIdx, item_idx: itemIdx})
            .into('invest_group_item')
          , dbTrx);
        }
      }
    
      await dbTrx.commit();
    } catch (err) {
      await dbTrx.rollback();
      throw err;
    }
  
    res.json(createResult());
  }));
  
  /**
   * item 삭제
   */
  router.delete('/:item_idx([0-9]+)', authTokenMiddleware, asyncHandler(async (req, res) => {
    //set vars: user idx
    const userIdx = req.user.user_idx;
  
    //set vars: request
    const itemIdx = req.params.item_idx;
  
    //check data
    let hasData = await db.exists(db.queryBuilder()
      .from('invest_item')
      .where('item_idx', itemIdx)
      .andWhere('user_idx', userIdx)
    );
    if (!hasData) throw new ResponseError('데이터가 존재하지 않음');
  
    let hasHistory = await db.exists(db.queryBuilder()
      .from('invest_history')
      .where('item_idx', itemIdx)
    );
    if (hasHistory) throw new ResponseError('history 있는 item 삭제 불가');
  
    /*
     * delete data
     */
    const dbTrx = await db.transaction();
    try {
      await db.execute(db.queryBuilder()
        .delete()
        .from('invest_unit_set')
        .where('item_idx', itemIdx)
      , dbTrx);
    
      await db.execute(db.queryBuilder()
        .delete()
        .from('invest_item')
        .where('item_idx', itemIdx)
      , dbTrx);
    
      await dbTrx.commit();
    } catch (err) {
      await dbTrx.rollback();
      throw err;
    }
  
    res.json(createResult());
  }));
  
  /**
   * item unit 추가
   */
  router.post('/:item_idx([0-9]+)/unit', authTokenMiddleware, asyncHandler(async (req, res) => {
    //set vars: user idx
    const userIdx = req.user.user_idx;
  
    //set vars: request
    const itemIdx = req.params.item_idx;
    let units = req.body.units;
    if (!Array.isArray(units) || !units.length) throw new ResponseError('추가할 unit 없음');
    
    //check data
    let hasItem = await db.exists(db.queryBuilder()
      .from('invest_item')
      .where('item_idx', itemIdx)
      .andWhere('user_idx', userIdx)
    );
    if (!hasItem) throw new ResponseError('item 존재하지 않음');
  
    /*
     * item unit 추가 처리
     */
    const dbTrx = await db.transaction();
    try {
      for (const _unitIdx of units) {
        //unit 유무 체크
        let _hasUnit = await db.exists(db.queryBuilder()
          .from('invest_unit')
          .where('unit_idx', _unitIdx)
          .andWhere('user_idx', userIdx)
        );
        if (!_hasUnit) throw new ResponseError('추가할 unit중 잘못된 unit이 있음');
      
        //item unit 유무 체크
        _hasUnit = await db.exists(db.queryBuilder()
          .from('invest_unit_set')
          .where('item_idx', itemIdx)
          .andWhere('unit_idx', _unitIdx)
        );
        if (_hasUnit) continue;
      
        //item unit insert 처리
        let _rsInsert = await db.execute(db.queryBuilder()
          .insert({item_idx: itemIdx, unit_idx: _unitIdx})
          .into('invest_unit_set')
        , dbTrx);
        if (!_rsInsert) throw new ResponseError('item에 unit 추가중 문제 발생');
      }
    
      await dbTrx.commit();
    } catch (err) {
      await dbTrx.rollback();
      throw err;
    }
  
    res.json(createResult());
  }));
  
  /**
   * item unit 수정
   */
  router.put('/:item_idx([0-9]+)/unit', authTokenMiddleware, asyncHandler(async (req, res) => {
    //set vars: user idx
    const userIdx = req.user.user_idx;
  
    //set vars: request
    const itemIdx = req.params.item_idx;
    let units = req.body.units;
    if (!Array.isArray(units) || !units.length) throw new ResponseError('수정할 unit 없음');
  
    //check data
    let hasItem = await db.exists(db.queryBuilder()
      .from('invest_item')
      .where('item_idx', itemIdx)
      .andWhere('user_idx', userIdx)
    );
    if (!hasItem) throw new ResponseError('item 존재하지 않음');
  
    //삭제전 unit 데이터 체크
    for (const _unitIdx of units) {
      let _hasUnit = await db.exists(db.queryBuilder()
        .from('invest_unit')
        .where('unit_idx', _unitIdx)
        .andWhere('user_idx', userIdx)
      );
      if (!_hasUnit) throw new ResponseError('수정할 unit중 잘못된 unit이 있음');
    }
  
    /*
     * item unit 수정 처리
     */
    const dbTrx = await db.transaction();
    try {
      //set vars: 기존 unit 목록
      let rsUnitSetList = await db.queryAll(db.queryBuilder()
        .select(['unit_set_idx', 'unit_idx'])
        .from('invest_unit_set')
        .where('item_idx', itemIdx)
      );
      
      //기존 등록 unit 중 삭제해야될 unit 삭제
      for (const _unitSet of rsUnitSetList) {
        if (units.includes(_unitSet.unit_idx)) {
          units.splice(units.indexOf(_unitSet.unit_idx), 1);
        } else {
          await db.execute(db.queryBuilder()
            .delete()
            .from('invest_unit_set')
            .where('unit_set_idx', _unitSet.unit_set_idx)
          , dbTrx);
        }
      }
      
      //새로 추가할 unit 추가
      for (const _unitIdx of units) {
        await db.execute(db.queryBuilder()
          .insert({item_idx: itemIdx, unit_idx: _unitIdx})
          .into('invest_unit_set')
        , dbTrx);
      }
      
      await dbTrx.commit();
    } catch (err) {
      await dbTrx.rollback();
      throw err;
    }
  
    res.json(createResult());
  }));
  
  /**
   * item unit 삭제
   */
  router.delete('/:item_idx([0-9]+)/unit', authTokenMiddleware, asyncHandler(async (req, res) => {
    //set vars: user idx
    const userIdx = req.user.user_idx;
  
    //set vars: request
    const itemIdx = req.params.item_idx;
    let units = req.body.units;
    if (!Array.isArray(units) || !units.length) throw new ResponseError('삭제할 unit 없음');
  
    //check data
    let hasItem = await db.exists(db.queryBuilder()
      .from('invest_item')
      .where('item_idx', itemIdx)
      .andWhere('user_idx', userIdx)
    );
    if (!hasItem) throw new ResponseError('item 존재하지 않음');
    
    /*
     * item unit 삭제 처리
     */
    const dbTrx = await db.transaction();
    try {
      for (const _unitIdx of units) {
        //unit 유무 체크
        let _hasUnit = await db.exists(db.queryBuilder()
          .from('invest_unit')
          .where('unit_idx', _unitIdx)
          .andWhere('user_idx', userIdx)
        );
        if (!_hasUnit) throw new ResponseError('삭제할 unit중 잘못된 unit이 있음');
      
        //item unit delete 처리
        await db.execute(db.queryBuilder()
          .delete()
          .from('invest_unit_set')
          .where('item_idx', itemIdx)
          .andWhere('unit_idx', _unitIdx)
        , dbTrx);
      }
    
      await dbTrx.commit();
    } catch (err) {
      await dbTrx.rollback();
      throw err;
    }
  
    res.json(createResult());
  }));
  
  return router;
}