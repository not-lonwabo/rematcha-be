const router = require('express').Router();
const utils = require('../lib/utils');
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');


//  POST /user/login — Sends the user authentication token ✔
router.post('/user/login', async (req, res, next) => {
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

// POST /user/signup — Creates new account ✔
router.post('/user/signup', async (req, res) => {
    const saltHash = utils.generatePassword(req.body.password);
    const generateId = uuidv4();

    const username = req.body.username;
    const salt = saltHash.salt;
    const hash = saltHash.hash;


    try {
        await pool.query('INSERT INTO users (id, username, salt, hash) VALUES ($1, $2, $3, $4)', [generateId, username, salt, hash]);
        res.status(201).json({ success: true, data: 'successfully registered!' });
    } catch (error) {
        res.json({ success: false, msg: error });
    }
});

//  GET /user/:userID — Gets the profile of the user ID - [PROTECTED-ROUTE]
router.get('/user/:userID', utils.authMiddleware, async (req, res) => {
    try {
        let user = await pool.query('SELECT * FROM users WHERE userID = $1', [req.params.userID]);
        res.status(200).send(user.rows[0]);
    } catch (error) {
        res.json({ success: false, msg: error });
    }
});


//  PUT /user/:userID — Update user details -[PROTECTED-ROUTE]
router.patch('/user/:userID', utils.authMiddleware, async (req, res) => {
    let userId = req.params.userID;
    let valuesToUpdateArray = Object.values(req.body);
    valuesToUpdateArray.push(userId);
    let keysArray = Object.keys(req.body);
    let itemsToUpdate = '';
    for (let i = 0; i < keysArray.length; i++) {
        if (i === keysArray.length - 1) {
            itemsToUpdate = itemsToUpdate + `"${keysArray[i]}" = $${i + 1}`
        } else {
            itemsToUpdate = itemsToUpdate + `"${keysArray[i]}" = $${i + 1},`;
        }
    }

    try {
        let updateString = `UPDATE users SET ${itemsToUpdate} WHERE id = $${keysArray.length + 1} RETURNING *`;
        let response = await pool.query(`${updateString}`, valuesToUpdateArray);
        res.status(200).send(response.rows[0]);
    } catch (error) {
        res.json({ success: false, msg: error });
    }
});

//  DELETE /user/:userID — Removes the user account - [PROTECTED-ROUTE]
router.delete('/user/:userID', utils.authMiddleware, async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE userID = $1', [req.params.userID]);
        res.status(204).json({ success: true, msg: 'Account deleted'})
    } catch (error) {
        res.json({ success: false, msg: error });
    }
});


//  GET /session/users/:connectionID — Returns both the users that have the connection ID. - [PROTECTED-ROUTE]
router.get('session/connection/:chatID', utils.authMiddleware, async (req, res) => {
    try {
        let connection = await pool.query('SELECT * FROM chats WHERE chat_id = $1', [req.params.chatID]);
        res.status(200).json({ success: true, data: connection });
    } catch (error) {
        res.json({ success: false, msg: error });
    }
});

//  DELETE /session/connection/:connectionID — Deletes all the data that have the connection ID. - [PROTECTED-ROUTE]
router.delete('/session/connection/:chatID', async (req, res) => {
    try {
        await pool.query('DELETE FROM connections WHERE chat_id = $1', [req.params.chatID]);
        res.status(204).json({ success: true, msg: 'unmatched'})
    } catch (error) {
        res.json({ success: false, msg: error });
    }
});

//  * POST /session/connection/:userID1/:userID2 — Adds user ID1 and user ID2 with the same connection ID. - [PROTECTED-ROUTE]
router.post('/session/connection/:userID', async (req, res) => {
    try {
        await pool.query('INSERT INTO chats (userID, messages) VALUES ($1, $2)', [req.params.userID, {"us": "You matched ❤"}]);
        res.status(204).json({ success: true, msg: 'matched'})
    } catch (error) {
        res.json({ success: false, msg: error });
    }
});



//  GET /match/:userID — Return all the matches of the logged-in user. - [PROTECTED-ROUTE]
router.patch('/like/:myUserID/:likeUserID', utils.authMiddleware, async (req, res) => {
    try {
        // await pool.query('UPDATE users SET myLikes = array_append(myLikes, $1) WHERE id = $2', [req.params.likeUserID, req.params.myUserId]);
        await pool.query('IF $1 = ANY (likeMe) WHERE id = $2 THEN (UPDATE users SET matches = array_append(matches, $3), array_remove(likeMe, $4) WHERE id = $5) ELSE UPDATE users SET myLikes = array_append(myLikes, $6) WHERE id = $7 END IF', [req.params.likeUserID, req.params.myUserID, req.params.myUserID, req.params.likeUserID, req.params.likeUserID, req.params.myUserID, req.params.likeUserID]);
        res.status(200).json({ success: true, data: 'success!' })
    } catch (error) {
        res.json({ success: false, msg: error });
    }
});

//  DELETE /match/:userID — Deletes the user ID from the match list. - [PROTECTED-ROUTE]
router.delete('/match/:userID', async (req, res, next) => {
    try {
        await pool.query('SELECT * FROM chats')
    } catch (error) {
        res.json({ success: false, msg: error });
    }
});





/* Optional
 * Recommendations
 * GET /recommendation — Returns a collection of the most appropriate profiles for logged-in users.
 */

module.exports = router;