require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const {Mysql} = require('./database/mysql');
const expressResponse = require('./helper/express-response');

//set vars: express
const app = express();
const port = 3000;
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//set database
const db = new Mysql(process.env.MYSQL_HOST, process.env.MYSQL_USER, process.env.MYSQL_PASSWORD, process.env.MYSQL_DATABASE, process.env.MYSQL_PORT);
app.set('db', db);

/*
 * 라우터 설정
 */
const investHistoryRouter = {
  unit: require('./router/investHistory/unit'),
  unitSet: require('./router/investHistory/unitSet'),
  company: require('./router/investHistory/company'),
  item: require('./router/investHistory/item')
}

app.use('/invest-history/unit', investHistoryRouter.unit);
app.use('/invest-history/unit-set', investHistoryRouter.unitSet);
app.use('/invest-history/company', investHistoryRouter.company);
app.use('/invest-history/item', investHistoryRouter.item);


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