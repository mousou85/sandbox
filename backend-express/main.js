require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const {Mysql} = require('./database/Mysql');
const expressResponse = require('./helper/express-response');

//set vars: express
const app = express();
const port = 5000;
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
  unit: require('./routes/investHistory/unit')(db),
  unitSet: require('./routes/investHistory/unitSet')(db),
  company: require('./routes/investHistory/company')(db),
  item: require('./routes/investHistory/item')(db),
  history: require('./routes/investHistory/history')(db)
}
// const asyncHandler = require("./helper/express-async-wrap");
// app.get('/', asyncHandler(async (req, res) => {
//   const {upsertSummary, inoutTypeList} = require('./helper/db/investHistory')(db);
//   res.send('1');
// }));
app.use('/invest-history/unit', investHistoryRouter.unit);
app.use('/invest-history/unit-set', investHistoryRouter.unitSet);
app.use('/invest-history/company', investHistoryRouter.company);
app.use('/invest-history/item', investHistoryRouter.item);
app.use('/invest-history/history', investHistoryRouter.history);


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