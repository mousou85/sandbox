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

//set vars: routers
const investHistoryRouter = require('./router/invest-history');
const {ResponseError} = require("./helper/express-response");

//set routers
app.use('/invest-history', investHistoryRouter);
Mysql.createUpdateClause({'test': 1, 'test2': 2, 'test3': {val: 1, raw: true}});


//set error handler
app.use('*', (req, res, next) => {
  next(new ResponseError('page not found', -1, 404));
});
app.use(expressResponse.error);

app.listen(port, () => {
  console.log(`listening on http://localhost:${port}`);
})