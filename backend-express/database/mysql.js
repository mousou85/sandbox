'use strict';
const mysql = require('mysql2/promise');

class Mysql {
  /**
   * 접속 정보
   * @type {Object}
   */
  connectionInfo = {
    host: null,
    port: null,
    user: null,
    password: null,
    database: null,
    connectionLimit: 10,
    queueLimit: 0,
    namedPlaceholders: true,
    dateStrings: 'date'
  };
  /**
   * @type {Pool|PoolCluster}
   */
  connectionPool;
  /**
   * @type {PoolConnection}
   */
  connection;
  /**
   * @type {number}
   */
  lastInsertId;

  constructor(host, user, password, database, port = 3306) {
    this.connectionInfo.host = host;
    this.connectionInfo.port = port;
    this.connectionInfo.user = user;
    this.connectionInfo.password = password;
    this.connectionInfo.database = database;

    this.connectionPool = mysql.createPool(this.connectionInfo);
  }
  /**
   * new connection return
   * @return {Promise<PoolConnection>}
   */
  async getConnection() {
    return await this.connectionPool.getConnection(conn => conn);
  }
  /**
   * select all
   * @param {string} sql
   * @param {Object} [params]
   * @return {Promise<Object[]>}
   */
  async queryAll(sql, params) {
    try {
      if (!this.connection) this.connection = await this.getConnection();

      const [rows, columns] = await this.connection.execute(sql, params);

      return rows;
    } catch (err) {
      throw err;
    }
  }
  /**
   * select 1 row
   * @param {string} sql
   * @param {Object} [params]
   * @return {Promise<Object>}
   */
  async queryRow(sql, params) {
    try {
      if (!this.connection) this.connection = await this.getConnection();

      const [rows, columns] = await this.connection.execute(sql, params);

      return rows.length ? rows[0] : null;
    } catch (err) {
      throw err;
    }
  }

  /**
   * select 1 row 1 column
   * @param {string} sql
   * @param {Object} params
   * @return {Promise<null|*>}
   */
  async queryScalar(sql, params) {
    try {
      if (!this.connection) this.connection = await this.getConnection();

      const [rows, columns] = await this.connection.execute(sql, params);
      if (!rows.length) return null;

      const firstRow = rows[0];
      return firstRow[Object.keys(firstRow)[0]];
    } catch (err) {
      throw err;
    }
  }
  /**
   * execute query
   * @param {string} sql
   * @param {Object} params
   * @return {Promise<number>} affected rows
   */
  async execute(sql, params) {
    let result;
    try {
      if (!this.connection) this.connection = await this.getConnection();

      result = await this.connection.execute(sql, params);
    } catch (err) {
      throw err;
    }

    this.lastInsertId = result[0].insertId;

    return result[0].affectedRows;
  }
  /**
   * get last insert id
   * @return {number}
   */
  getLastInsertID() {
    return this.lastInsertId;
  }

  /**
   * create update clause
   * @param {Object} data
   * @return {(string|{})[]}
   */
  static createUpdateClause(data) {
    let sqlUpdate = '';
    let params = {};

    for (let key in data) {
      let _item = data[key];

      sqlUpdate += `${key} = :${key}, `;
      params[key] = _item;
    }
    sqlUpdate = sqlUpdate.trim().replace(/,$/, '');

    return [sqlUpdate, params];
  }
  /**
   * start transaction
   * @return {Promise<void>}
   */
  async beginTransaction() {
    try {
      if (!this.connection) this.connection = await this.getConnection();

      await this.connection.beginTransaction();
    } catch (err) {
      throw err;
    }
  }
  /**
   * commit
   * @return {Promise<void>}
   */
  async commit() {
    try {
      await this.connection.commit();
    } catch (err) {
      throw err;
    }
  }
  /**
   * rollback
   * @return {Promise<void>}
   */
  async rollback() {
    try {
      await this.connection.rollback();
    } catch (err) {
      throw err;
    }
  }
  /**
   * return connection to pool
   * @return {Promise<void>}
   */
  async releaseConnection() {
    if (this.connection) await this.connection.release();
  }
}

module.exports = {Mysql}