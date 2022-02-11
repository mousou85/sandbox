require('dotenv').config();
const express = require('express');
const {Mysql} = require('./database/mysql');


const app = express();
const port = 3000;
const db = new Mysql(process.env.MYSQL_HOST, process.env.MYSQL_USER, process.env.MYSQL_PASSWORD, process.env.MYSQL_DATABASE, process.env.MYSQL_PORT);

app.get('/', async (req, res) => {
  

  res.send('hello');
});

app.listen(port, () => {
  console.log(`listening on http://localhost:${port}`);
})