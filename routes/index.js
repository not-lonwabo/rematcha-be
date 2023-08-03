const router = require('express').Router();
const utils = require('../lib/utils');
const pool = require('../db');

router.post('/login', async (req, res, next) => {
    try {
        const user = await pool.query('SELECT * FROM users WHERE "username" = $1', [req.body.username]);
        if (!user.rows[0]) {
            res.status(401).json({ success: false, msg: 'Could not find user'});
        };

        const isValid = utils.validatePassword(req.body.password, user.rows[0].hash, user.rows[0].salt);
        if (isValid) {
            const tokenObject = utils.issueJWT(user.rows[0]);
            res.status(200).json({ success: true, token: tokenObject.token, expiresIn: tokenObject.expiresIn });
        } else {
            res.status(401).json({ success: false, msg: "you entered the wrong password" });
        }
    } catch (error) {
        next(error);
    }
});

router.post('/register', async (req, res) => {
    const saltHash = utils.generatePassword(req.body.password);

    const username = req.body.username;
    const salt = saltHash.salt;
    const hash = saltHash.hash;

    try {
        await pool.query('INSERT INTO users (username, salt, hash) VALUES ($1, $2, $3)', [username, salt, hash]);
        res.redirect('./login');
    } catch (error) {
        res.json({ success: false, msg: error });
    }
});

router.get('/', (req, res) => {
    res.send('<h1>Home</h1><p>Please <a href="/register">register</a></p>');
});

router.get('/login', (req, res) => {
    const form = '<h1>Login Page</h1><form method="POST" action"/login">\
    Enter Username:<br><input type="text" name="username">\
    <br>Enter Password:<br><input type="password" name="password">\
    <br><br><input type="submit" value="submit"></form>';

    res.send(form);
});

router.get('/register', (req, res) => {
    const form = '<h1>Register Page</h1><form method="POST" action"/register">\
    Enter Username:<br><input type="text" name="username">\
    <br>Enter Password:<br><input type="password" name="password">\
    <br><br><input type="submit" value="submit"></form>';

    res.send(form);
});

router.get('/protected-route', utils.authMiddleware, (req, res, next) => {
    res.send('<h1>You are authenticated</h1><p><a href="/logout">Logout and reload</a></p>');
});

// Visiting this route logs the user out
router.get('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        res.redirect('/protected-route');
    });
});

router.get('/login-success', (req, res) => {
    res.send('<p>You successfully logged in. --> <a href="/protected-route">Go to protected route</a></p>');
});

router.get('/login-failure', (req, res) => {
    res.send('You entered the wrong password.');
});

module.exports = router;