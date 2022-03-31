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
   * @param {string} str
   * @return {Knex.Raw<TResult>}
   */
  raw(str) {
    return this.#knex.raw(str);
  }
  
  /**
   * execute raw query
   * @param {string} str
   * @return {Promise<number>|Promise<Array>}
   */
  async executeRaw(str) {
    return await this.#knex.raw(str).then((result) => {
      if (Array.isArray(result[0])) {
        return result[0];
      } else {
        return result[0].insertId || result[0].affectedRows;
      }
    });
  }
  
  /**
   * check exists record
   * @param {Knex.QueryBuilder} queryBuilder
   * @param {Knex.Transaction} [trx]
   * @return {Promise<boolean>}
   */
  async exists(queryBuilder, trx) {
    try {
      if (trx) queryBuilder.transacting(trx);
      
      queryBuilder.clearSelect().count();
      
      return await queryBuilder.then((result) => {
        if (!result.length) return false;
        result = result[0];
        return !!result[Object.keys(result)[0]];
      })
    } catch (err) {
      throw err;
    }
  }
  
  /**
   * @param {Knex.QueryBuilder} queryBuilder
   * @param {Knex.Transaction} [trx]
   * @return {Promise<Object[]>}
   */
  async queryAll(queryBuilder, trx) {
    try {
      if (trx) queryBuilder.transacting(trx);
      
      return await queryBuilder.then((result) => {
        return result;
      });
    } catch (err) {
      throw err;
    }
  }
  
  /**
   * query 1 row
   * @param {Knex.QueryBuilder} queryBuilder
   * @param {Knex.Transaction} [trx]
   * @return {Promise<Object|null>}
   */
  async queryRow(queryBuilder, trx) {
    try {
      if (trx) queryBuilder.transacting(trx);
      
      return await queryBuilder.first().then((result) => {
        return result ?? null;
      });
    } catch (err) {
      throw err;
    }
  }
  
  /**
   * select 1 row 1 column
   * @param {Knex.QueryBuilder|Knex.Raw} queryBuilder
   * @param {Knex.Transaction} [trx]
   * @return {Promise<null|*>}
   */
  async queryScalar(queryBuilder, trx) {
    try {
      if (trx) queryBuilder.transacting(trx);
      
      return await queryBuilder.first().then((result) => {
        if (!result) return null;
        
        return result[Object.keys(result)[0]];
      });
    } catch (err) {
      throw err;
    }
  }
  
  /**
   * execute query
   * @param {Knex.QueryBuilder} queryBuilder
   * @param {Knex.Transaction} [trx]
   * @return {Promise<number>|Promise<Array>} last insert id or affected rows
   */
  async execute(queryBuilder, trx) {
    try {
      if (trx) queryBuilder.transacting(trx);
      
      return await queryBuilder.then((result) => {
        if (Array.isArray(result)) {
          return result.length > 1 ? result : result[0];
        } else {
          return result;
        }
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