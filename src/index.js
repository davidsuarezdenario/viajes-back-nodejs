const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
require('./config/database');
const apiKeyVerify = require('./middleware/apiKey');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(apiKeyVerify);



const greetingRouter = require('./routes/greeting');
app.use('/greeting', greetingRouter);

const authRouter = require('./routes/auth');
app.use('/auth', authRouter);

const travelRouter = require('./routes/travel');
app.use('/travel', travelRouter);

const usersRouter = require('./routes/users');
app.use('/users',usersRouter);



const port = 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});