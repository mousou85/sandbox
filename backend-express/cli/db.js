//set environment
require('dotenv').config();

//load native module
const fs = require('fs');
const path = require('path');

//load cli module
const {program} = require('commander');
const chalk = require('chalk');

//load db module
const {Mysql} = require('#database/Mysql');

//set database
const db = new Mysql(
  process.env.MYSQL_HOST,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_PORT
);

(async () => {
  /**
   * DB 테이블 생성 CLI
   */
  program.command('create')
    .description('DB 테이블 생성')
    .argument('<function>', '생성할 기능 DB 테이블')
    .addHelpText('after', `
Examples:
  $ db create user ${chalk.gray('# user 테이블 생성')}
  $ db create investHistory ${chalk.gray('# 재테크 가계부 테이블 생성')}
    `)
    .action(async (functionName) => {
      try {
        const ddlPath = path.resolve(__dirname, '../database/ddl', `${functionName}.sql`);
        if (!fs.existsSync(ddlPath)) {
          throw new Error("생성할 테이블의 DDL 파일을 찾지 못했습니다.");
        }
        let ddlData = fs.readFileSync(ddlPath, {encoding: 'utf-8', flag: 'r'});
        ddlData = ddlData.replaceAll('\r\n', '\n')
          .split(';\n')
          .filter(sql => sql.length > 0);
        if (!ddlData.length) throw new Error("실행할 쿼리가 없습니다.");
  
        for (const sql of ddlData) {
          await db.executeRaw(sql);
        }
      } catch (err) {
        console.error(chalk.redBright(err.sqlMessage ? err.sqlMessage : err.message));
        console.error(err.stack);
        process.exit();
      }
      
      console.info('사용자 테이블 생성 완료');
      process.exit();
    });
  
  await program.parseAsync(process.argv);
})();