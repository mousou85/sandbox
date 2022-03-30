class Mysql {
  /**
   * @type {Knex}
   */
  #knex = null;
  
  constructor(host, user, password, database, port = 3306) {
    this.#knex = require('knex')({
      client: 'mysql2',
      connection: {
        host: host,
        port: port,
        user: user,
        password: password,
        database: database,
        dateStrings: true,
        pool: {min: 2, max: 10}
      }
    });
  }
  
  /**
   * @return {Knex.QueryBuilder}
   */
  queryBuilder() {
    return this.#knex.queryBuilder();
  }
  
  /**
   * get raw query(no escape)
   * @param str
   * @return {Knex.Raw<TResult>}
   */
  raw(str) {
    return this.#knex.raw(str);
  }
  
  /**
   * @param {Knex.QueryBuilder} query
   * @param {Knex.Transaction} [trx]
   * @return {Promise<Object[]>}
   */
  async queryAll(query, trx) {
    try {
      if (trx) query.transacting(trx);
      
      return await query.then((result) => {
        return result;
      });
    } catch (err) {
      throw err;
    }
  }
  
  /**
   * query 1 row
   * @param {Knex.QueryBuilder} query
   * @param {Knex.Transaction} [trx]
   * @return {Promise<Object|null>}
   */
  async queryRow(query, trx) {
    try {
      if (trx) query.transacting(trx);
      
      return await query.first().then((result) => {
        return result ?? null;
      });
    } catch (err) {
      throw err;
    }
  }
  
  /**
   * select 1 row 1 column
   * @param {Knex.QueryBuilder|Knex.Raw} query
   * @param {Knex.Transaction} [trx]
   * @return {Promise<null|*>}
   */
  async queryScalar(query, trx) {
    try {
      if (trx) query.transacting(trx);
      
      return await query.first().then((result) => {
        if (!result) return null;
        
        return result[Object.keys(result)[0]];
      });
    } catch (err) {
      throw err;
    }
  }
  
  /**
   * execute query
   * @param {Knex.QueryBuilder} query
   * @param {Knex.Transaction} [trx]
   * @return {Promise<number>} last insert id or affected rows
   */
  async execute(query, trx) {
    try {
      if (trx) query.transacting(trx);
      
      return await query.then((result) => {
        console.log(['execute', result]);
        return result;
      });
    } catch (err) {
      throw err;
    }
  }
  
  /**
   * start transaction
   * @return {Promise<Knex.Transaction>}
   */
  async transaction() {
    return this.#knex.transaction();
  }
}

module.exports = {Mysql};