const express = require('express');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

app.get('/', (req, res) => {
    res.send({status: 200, msg: 'Hello world!'});
});

app.listen(PORT, () => {
    console.log(`Server listeniing on port: ${PORT}`)
});