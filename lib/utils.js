const jsonwebtoken = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const pathToKey = path.join(__dirname, '..', 'id_rsa_priv.pem');
const pathToPubKey = path.join(__dirname, '..', 'id_rsa_pub.pem');

const PRIV_KEY = fs.readFileSync(pathToKey, 'utf8');
const PUB_KEY = fs.readFileSync(pathToPubKey, 'utf8');

function validatePassword (password, hash, salt) {
    let hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64,'sha512').toString('hex');
    return hash === hashVerify;
}

function generatePassword (password) {
    let salt = crypto.randomBytes(32).toString('hex');
    let genHash = crypto.pbkdf2Sync(password, salt, 10000, 64,'sha512').toString('hex');

    return {
        salt: salt,
        hash: genHash
    };
}

function issueJWT(user) {
    const _id = user.id;

    const expiresIn = '1h';

    const payload = {
        sub: _id,
        iat: Date.now()
    };

    const signedToken = jsonwebtoken.sign(payload, PRIV_KEY, { expiresIn: expiresIn, algorithm: 'RS256' });

    return {
        token: "Bearer " + signedToken,
        expiresIn: expiresIn
    }
}

function authMiddleware(req, res, next) {
    const token = req.headers?.authorization && req.headers.authorization.split(' ');
    if (token && token[0] === 'Bearer' && token[1].match(/\S+\.\S+\.\S+/) !== null) {
        try {
            const verification = jsonwebtoken.verify(token[1], PUB_KEY, { algorithms: ['RS256'] });
            req.jwt = verification;
            next();
        } catch (error) {
            res.status(401).json({ success: false, msg: error});
        }    
    } else {
        res.status(401).send('<h2>You are not authenticated!</h2><p><a href="/login">Login</a></p>');
    }
}

module.exports.validatePassword = validatePassword;
module.exports.generatePassword = generatePassword;
module.exports.issueJWT = issueJWT;
module.exports.authMiddleware = authMiddleware;