//load express module
const express = require('express');
const {asyncHandler, createResult, ResponseError} = require('#helpers/expressHelper');
const authTokenMiddleWare = require('#middlewares/authenticateToken');

/**
 * @param {Mysql} db
 * @return {Router}
 */
module.exports = (db) => {
  const router = express.Router();
  
  //load invest history helpers
  const investHistoryHelper = require('#helpers/investHistoryHelper')(db);
  
  //set vars: invest history const
  const itemTypeList = investHistoryHelper.itemTypeList;
  
  /**
   * group 리스트
   */
  router.get('/', authTokenMiddleWare, asyncHandler(async (req, res) => {
    //set vars: user idx
    const userIdx = req.user.user_idx;
  
    //set vars: 리스트
    let rsGroupList = await db.queryAll(db.queryBuilder()
      .select(['group_idx', 'group_name'])
      .from('invest_group')
      .where('user_idx', userIdx)
      .orderBy('group_idx', 'asc')
    );
  
    for (const groupPos in rsGroupList) {
      //set vars: group data
      let _group = rsGroupList[groupPos];
    
      //item list 세팅
      _group.item_list = await db.queryAll(db.queryBuilder()
        .select(['igi.item_idx', 'ii.item_type', 'ii.item_name', 'ii.closed_at'])
        .from ('invest_group_item AS igi')
        .join('invest_item AS ii', 'igi.item_idx', 'ii.item_idx')
        .where('igi.group_idx', _group.group_idx)
        .orderBy('igi.item_idx', 'ASC')
      );
      _group.item_count = _group.item_list.length;
      
      //item list 가공
      for (const itemPos in _group.item_list) {
        //set vars: item data
        let _item = _group.item_list[itemPos];
  
        _item.item_type_text = itemTypeList[_item.item_type];
        
        //unit list 세팅
        _item.unit_list = await db.queryAll(db.queryBuilder()
          .select(['ius.unit_idx', 'iu.unit', 'iu.unit_type'])
          .from('invest_unit_set AS ius')
          .join('invest_unit AS iu', 'ius.unit_idx', 'iu.unit_idx')
          .where('ius.item_idx', _item.item_idx)
          .orderBy('ius.unit_set_idx', 'asc')
        );
        
        _group.item_list[itemPos] = _item;
      }
    
      rsGroupList[groupPos] = _group;
    }
  
    res.json(createResult({list: rsGroupList}));
  }));
  
  /**
   * group 데이터
   */
  router.get('/:group_idx([0-9]+)', authTokenMiddleWare, asyncHandler(async (req, res) => {
    //set vars: user idx
    const userIdx = req.user.user_idx;
  
    //set vars: request
    const groupIdx = req.params.group_idx;
  
    //set vars: 데이터
    let rsGroup = await db.queryRow(db.queryBuilder()
      .select(['group_idx', 'group_name'])
      .from('invest_group')
      .where('group_idx', groupIdx)
      .andWhere('user_idx', userIdx)
    );
    if (!rsGroup) throw new ResponseError('데이터가 존재하지 않음');
  
    //set vars: 포함된 item list
    rsGroup.item_list = await db.queryAll(db.queryBuilder()
      .select(['igi.item_idx', 'ii.item_type', 'ii.item_name', 'ii.closed_at'])
      .from('invest_group_item AS igi')
      .join('invest_item AS ii', 'igi.item_idx', 'ii.item_idx')
      .where('igi.group_idx', rsGroup.group_idx)
      .orderBy('igi.item_idx', 'ASC')
    );
    rsGroup.item_count = rsGroup.item_list.length;
  
    //item list 가공
    for (const itemPos in rsGroup.item_list) {
      //set vars: item data
      let _item = rsGroup.item_list[itemPos];
    
      _item.item_type_text = itemTypeList[_item.item_type];
    
      //unit list 세팅
      _item.unit_list = await db.queryAll(db.queryBuilder()
        .select(['ius.unit_idx', 'iu.unit', 'iu.unit_type'])
        .from('invest_unit_set AS ius')
        .join('invest_unit AS iu', 'ius.unit_idx', 'iu.unit_idx')
        .where('ius.item_idx', _item.item_idx)
        .orderBy('ius.unit_set_idx', 'asc')
      );
  
      rsGroup.item_list[itemPos] = _item;
    }
  
    res.json(createResult(rsGroup));
  }));
  
  /**
   * group 추가
   */
  router.post('/', authTokenMiddleWare, asyncHandler(async (req, res) => {
    //set vars: user idx
    const userIdx = req.user.user_idx;
  
    //set vars: request
    let groupName = req.body.group_name ? req.body.group_name.trim() : '';
    if (!groupName) throw new ResponseError('group_name값은 필수입력임');
    if (groupName.length > 50) throw new ResponseError('group_name은 50자 이하로 입력');
  
    //중복 체크
    let hasData = await db.exists(db.queryBuilder()
      .from('invest_group')
      .where('group_name', groupName)
      .andWhere('user_idx', userIdx)
    );
    if (hasData) throw new ResponseError('이미 등록된 group_name임');
  
    //insert data
    const groupIdx = await db.execute(db.queryBuilder()
      .insert({user_idx: userIdx, group_name: groupName})
      .into('invest_group')
    );
    if (!groupIdx) throw new ResponseError('group 추가 실패함');
  
    res.json(createResult({group_idx: groupIdx}));
  }));
  
  /**
   * group 수정
   */
  router.put('/:group_idx([0-9]+)', authTokenMiddleWare, asyncHandler(async (req, res) => {
    //set vars: user idx
    const userIdx = req.user.user_idx;
  
    //set vars: request
    const groupIdx = req.params.group_idx;
    if (!groupIdx) throw new ResponseError('잘못된 접근임');
    let groupName = req.body.group_name ? req.body.group_name.trim() : '';
    if (!groupName) throw new ResponseError('group_name값은 필수입력');
    if (groupName.length > 50) throw new ResponseError('group_name은 50자 이하로 입력');
  
    //check data
    let hasData = await db.exists(db.queryBuilder()
      .from('invest_group')
      .where('group_idx', groupIdx)
      .andWhere('user_idx', userIdx)
    );
    if (!hasData) throw new ResponseError('데이터가 존재하지 않음');
  
    //update data
    let rsUpdate = await db.execute(db.queryBuilder()
      .update({group_name: groupName})
      .from('invest_group')
      .where('group_idx', groupIdx)
    );
    if (!rsUpdate) throw new ResponseError('group 수정 실패함');
  
    res.json(createResult());
  }));
  
  /**
   * group 삭제
   */
  router.delete('/:group_idx([0-9]+)', authTokenMiddleWare, asyncHandler(async (req, res) => {
    //set vars: user idx
    const userIdx = req.user.user_idx;
  
    //set vars: request
    const groupIdx = req.params.group_idx;
  
    //check data
    let hasData = await db.exists(db.queryBuilder()
      .from('invest_group')
      .where('group_idx', groupIdx)
      .andWhere('user_idx', userIdx)
    );
    if (!hasData) throw new ResponseError('데이터가 존재하지 않음');
  
    let hasItem = await db.exists(db.queryBuilder()
      .from('invest_group_item')
      .where('group_idx', groupIdx)
    );
    if (hasItem) throw new ResponseError('item이 존재하는 group은 삭제 할 수 없음');
  
    //delete group data
    await db.execute(db.queryBuilder()
      .delete()
      .from('invest_group')
      .where('group_idx', groupIdx)
    );
  
    res.json(createResult());
  }));
  
  /**
   * group item 추가
   */
  router.post('/:group_idx([0-9]+)/item', authTokenMiddleWare, asyncHandler(async (req, res) => {
    //set vars: user idx
    const userIdx = req.user.user_idx;
    
    //set vars: request
    const groupIdx = req.params.group_idx;
    if (!groupIdx) throw new ResponseError('잘못된 접근임');
    let items = req.body.items;
    if (!Array.isArray(items) || !items.length) throw new ResponseError('추가할 item이 없음');
    
    //check data
    let hasData = await db.exists(db.queryBuilder()
      .from('invest_group')
      .where('group_idx', groupIdx)
      .andWhere('user_idx', userIdx)
    );
    if (!hasData) throw new ResponseError('group 데이터가 존재하지 않음');
    
    const dbTrx = await db.transaction();
    try {
      for (const _itemIdx of items) {
        //item 유무 체크
        let _hasItem = await db.exists(db.queryBuilder()
          .from('invest_item')
          .where('item_idx', _itemIdx)
          .andWhere('user_idx', userIdx)
        );
        if (!_hasItem) throw new ResponseError('group에 추가할 item중 잘못된 item이 있음');
        
        //group item 유무 체크
        _hasItem = await db.exists(db.queryBuilder()
          .from('invest_group_item')
          .where('item_idx', _itemIdx)
          .andWhere('group_idx', groupIdx)
        );
        if (_hasItem) continue;
        
        //group item insert 처리
        let _rsInsert = await db.execute(db.queryBuilder()
          .insert({group_idx: groupIdx, item_idx: _itemIdx})
          .into('invest_group_item')
        , dbTrx);
        if (!_rsInsert) throw new ResponseError('group에 item 추가중 문제 발생');
      }
      
      await dbTrx.commit();
    } catch (err) {
      await dbTrx.rollback();
      throw err;
    }
  
    res.json(createResult());
  }));
  
  /**
   * group item 삭제
   */
  router.delete('/:group_idx([0-9]+)/item', authTokenMiddleWare, asyncHandler(async (req, res) => {
    //set vars: user idx
    const userIdx = req.user.user_idx;
  
    //set vars: request
    const groupIdx = req.params.group_idx;
    if (!groupIdx) throw new ResponseError('잘못된 접근임');
    let items = req.body.items;
    if (!Array.isArray(items) || !items.length) throw new ResponseError('삭제할 item이 없음');
  
    //check data
    let hasData = await db.exists(db.queryBuilder()
      .from('invest_group')
      .where('group_idx', groupIdx)
      .andWhere('user_idx', userIdx)
    );
    if (!hasData) throw new ResponseError('group 데이터가 존재하지 않음');
  
    const dbTrx = await db.transaction();
    try {
      for (const _itemIdx of items) {
        //item 유무 체크
        let _hasItem = await db.exists(db.queryBuilder()
          .from('invest_item')
          .where('item_idx', _itemIdx)
          .andWhere('user_idx', userIdx)
        );
        if (!_hasItem) throw new ResponseError('group에 삭제할 item중 잘못된 item이 있음');
      
        //group item delete 처리
        await db.execute(db.queryBuilder()
          .delete()
          .from('invest_group_item')
          .where('item_idx', _itemIdx)
          .andWhere('group_idx', groupIdx)
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
};