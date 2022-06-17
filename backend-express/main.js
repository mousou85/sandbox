//set environment
require('dotenv').config();
const NODE_ENV = process.env.NODE_ENV || 'production';

//load express module
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const errorResponseMiddleWare = require('#middlewares/errorResponse');
const {ResponseError} = require('#helpers/expressHelper');

//load db module
const {Mysql} = require('#database/Mysql');

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
const userRouter = require('#routes/user')(db);

app.use('/user', userRouter);
app.use('/invest-history/unit', investHistoryRouter.unit);
app.use('/invest-history/unit-set', investHistoryRouter.unitSet);
app.use('/invest-history/company', investHistoryRouter.company);
app.use('/invest-history/item', investHistoryRouter.item);
app.use('/invest-history/history', investHistoryRouter.history);
app.use('/invest-history/summary', investHistoryRouter.summary);


/*
 * 에러 핸들러
 */
app.use('*', (req, res, next) => {
  next(new ResponseError('page not found', -1, 404));
});
app.use(errorResponseMiddleWare);

app.listen(port, () => {
  console.log(`listening on http://localhost:${port}`);
})