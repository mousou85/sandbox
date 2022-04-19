require('dotenv').config();
const NODE_ENV = process.env.NODE_ENV || 'production';
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const {Mysql} = require('#database/Mysql');
const expressResponse = require('#helper/express-response');

//set vars: express
const app = express();
const port = process.env.PORT;
app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//set database
const db = new Mysql(
  process.env.MYSQL_HOST,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_PORT
);

/*
 * 라우터 설정
 */
const investHistoryRouter = {
  unit: require('#routes/investHistory/unit')(db),
  unitSet: require('#routes/investHistory/unitSet')(db),
  company: require('#routes/investHistory/company')(db),
  item: require('#routes/investHistory/item')(db),
  history: require('#routes/investHistory/history')(db),
  summary: require('#routes/investHistory/summary')(db),
}
// const asyncHandler = require("./helper/express-async-wrap");
// app.get('/', asyncHandler(async (req, res) => {
//   const {upsertSummary, inoutTypeList} = require('./helper/db/investHistory')(db);
//
//   const rsUnitSet = await db.queryAll(db.queryBuilder()
//       .select()
//       .from('invest_unit_set')
//   );
//   const dateList = [
//     '2021-09-01',
//     '2021-10-01',
//     '2021-11-01',
//     '2021-12-01',
//     '2022-01-01',
//     '2022-02-01',
//     '2022-03-01',
//     '2022-04-01',
//   ];
//
//   const trx = await db.transaction();
//   try {
//     for (const unitSet of rsUnitSet) {
//       for (const date of dateList) {
//         await upsertSummary(unitSet.item_idx, date, trx);
//         // console.log([unitSet, date]);
//       }
//     }
//
//     await trx.commit();
//   } catch (err) {
//     await trx.rollback();
//     throw err;
//   }
//
//
//   res.send('1');
// }));
app.use('/invest-history/unit', investHistoryRouter.unit);
app.use('/invest-history/unit-set', investHistoryRouter.unitSet);
app.use('/invest-history/company', investHistoryRouter.company);
app.use('/invest-history/item', investHistoryRouter.item);
app.use('/invest-history/history', investHistoryRouter.history);
app.use('/invest-history/summary', investHistoryRouter.summary);


/*
 * 에러 핸들러
 */
const {ResponseError} = require("./helper/express-response");
app.use('*', (req, res, next) => {
  next(new ResponseError('page not found', -1, 404));
});
app.use(expressResponse.error);

app.listen(port, () => {
  console.log(`listening on http://localhost:${port}`);
})