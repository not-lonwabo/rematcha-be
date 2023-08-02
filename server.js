const express = require('express');

var routes = require('./routes');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({extended: true}));


/**
 * -------------- ROUTES ----------------
 */

// Imports all of the routes from ./routes/index.js
app.use(routes);


/**
 * -------------- SERVER ----------------
 */

// Server listens on http://localhost:5000
app.listen(PORT, () => {
    console.log(`Server listeniing on port: ${PORT}`)
});