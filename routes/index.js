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


//  GET /chats/:chatID — Returns both the users that have the connection ID. - [PROTECTED-ROUTE]
router.get('chats/:chatID', utils.authMiddleware, async (req, res) => {
    try {
        let connection = await pool.query('SELECT * FROM chats WHERE chat_id = $1', [req.params.chatID]);
        res.status(200).json({ success: true, data: connection });
    } catch (error) {
        res.json({ success: false, msg: error });
    }
});

//  DELETE /chats/:userID — Deletes the user ID from the match list. - [PROTECTED-ROUTE]
router.delete('/chats/:chatID', async (req, res, next) => {
    try {
        await pool.query('DELETE FROM chats WHERE chat_id = $1', [req.params.chatID])
    } catch (error) {
        res.json({ success: false, msg: error });
    }
});

//  * POST /chats/:chatID — Adds chat message to chatID. - [PROTECTED-ROUTE]
router.patch('/chats/:chatID', async (req, res) => {
    const message = `{"${req.body.username}": "${req.body.message}"}`;
    // jsondata::jsonb || '{"add_new_data": true}'
    const queryMessage = `UPDATE chats SET messages = messages || '${message}'::jsonb WHERE chat_id = $1`
    try {
        await pool.query(queryMessage, [req.params.chatID]);
        res.status(200).json({ success: true, msg: 'sent'})
    } catch (error) {
        console.log('------> ', error);
        res.json({ success: false, msg: error });
    }
});



//  GET /like/:myUserID/:likeUserID — Return all the matches of the logged-in user. - [PROTECTED-ROUTE] 413e4e17-96c5-4b8b-b52a-bc1ce57927ab f8fe67a5-ed2b-45f5-8899-35b75d9e1ed3
router.patch('/like/:myUserID/:likeUserID', utils.authMiddleware, async (req, res) => {
    const matchId = uuidv4();
    const myId = req.params.myUserID;
    const otherId = req.params.likeUserID;

    try {
        let isMatch = await pool.query('SELECT * FROM users WHERE $1 = ANY(likeme)', [otherId]);
        
        if (isMatch.rows.length > 0) {
            const matchQueryMessage = `INSERT INTO chats (chat_id, user_id, other_id, messages) VALUES ($1, $2, $3, '[{"match": "You matched"}]')`;

            await pool.query('UPDATE users SET matches = array_append(matches, $1), likeme = array_remove(likeme, $2) WHERE id = $3', [otherId, otherId, myId]);
            await pool.query(matchQueryMessage, [matchId, myId, otherId]);

            res.status(200).json({success: true, data: {"message": "It's a match ❤"}});
        } else {
            await pool.query('UPDATE users SET mylikes = array_append(mylikes, $1) WHERE id = $2', [otherId, myId]);
            await pool.query('UPDATE users SET likeme = array_append(likeme, $1) WHERE id = $2', [myId, otherId]);

            res.status(200).json({success: true, data: {}});
        }
    } catch (error) {
        res.status(400).json({ success: false, msg: error });
    }
});





/* Optional
 * Recommendations
 * GET /recommendation — Returns a collection of the most appropriate profiles for logged-in users.
 */

module.exports = router;