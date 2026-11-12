const express = require('express');
const app = express()

//USE PROXY SERVER TO REDIRECT THE INCOMMING REQUEST
const httpProxy = require('http-proxy')
const proxy = httpProxy.createProxyServer();

const jwt = require('jsonwebtoken')
require('dotenv').config()
const JWT_SECRETE = process.env.JWT_SECRETE;

// TARGET URLS (set by Kubernetes env vars, defaults are for running locally)
const REGISTER_SERVICE_URL = process.env.REGISTER_SERVICE_URL || 'http://127.0.0.1:5003';
const DELETE_SERVICE_URL = process.env.DELETE_SERVICE_URL || 'http://127.0.0.1:5004';

// IF A TARGET IS DOWN, RETURN 502 INSTEAD OF CRASHING THE GATEWAY
proxy.on('error', (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(502).json({ message: 'Bad gateway: target service unreachable' });
});

function authToken(req, res, next) {
    console.log(req.headers.authorization)
    const header = req?.headers.authorization;
    const token = header && header.split(' ')[1];

    // CASE 1: NO TOKEN
    if (!token) {
        return res.status(401).json({ message: 'Please send token' });
    }

    jwt.verify(token, JWT_SECRETE, (err, user) => {
        if (err) {
            // CASE 2: EXPIRED TOKEN
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token has expired' });
            }
            // CASE 3: INVALID TOKEN (bad signature, malformed, etc.)
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

function authRole(role) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ message: 'Unauthorized: insufficient role' });
        }
        next();
    }
}

//REDIRECT TO THE REGISTRATION MICROSERVICE, public, no token required
app.use('/register', (req, res) => {
    console.log("INSIDE API GATEWAY register ROUTE")
    req.url = req.originalUrl;
    proxy.web(req, res, { target: REGISTER_SERVICE_URL });
})

//REDIRECT TO THE DELETE STUDENT MICROSERVICE
app.use('/student', (req, res) => {
    console.log("INSIDE API GATEWAY student ROUTE")
    req.url = req.originalUrl;
    proxy.web(req, res, { target: DELETE_SERVICE_URL });
})

app.listen(4000, '0.0.0.0', () => {
    console.log("API Gateway Service is running on PORT NO : 4000")
})