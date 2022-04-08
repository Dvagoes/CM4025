const express = require('express');
const app = express();
const url = require('url');
const ejs = require('ejs');
const fs = require('fs')
require('dotenv').config();
const path = require('path');
const router = express.Router();
const http = require('http');
const bodyParser = require('body-parser');
var session = require('express-session')
const cookieParser = require('cookie-parser')


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('./public'));
app.use(cookieParser())
app.use(session({
    secret: 'replace me',
    resave: true,
    saveUninitialized: true
}));
app.use(express.json());

const mClient = require('mongodb').MongoClient;

mClient.connect(process.env.uri, function (err, client) {
    if (err) throw err;
    db = client.db('CM4025');
    app.listen(8080);
    console.log("Running on 8080")
});

app.get('/', function (req, res) {
    db.collection('Posts').find(req.body).toArray(function (err, result) {
        if (err) throw err;
        posts = JSON.parse(JSON.stringify(result));
        if (req.session.loggedin) {

        }
        res.render('index', {
            posts: posts,
            session: req.session
        });

    });
});

app.get('/game', function (req, res) {
    db.collection('Posts').find(req.body).toArray(function (err, result) {

        posts = JSON.parse(JSON.stringify(result));
        res.render('game', {
            posts: posts
        });
    });
});

app.get('/profile', function (req, res) {
    db.collection('UserData').find(req.body).toArray(function (err, result) {
        if (err) throw err;
        users = JSON.parse(JSON.stringify(result));
        res.render('profile', {
            posts: posts
        });
    });
});

app.get("/getUserData", function (req, res) {
    db.collection('UserData').find(req.body).toArray(function (err, result) {
        if (err) throw err;
        res.send(JSON.stringify(result));
    });
});

app.get("/getPosts", function (req, res) {
    db.collection('Posts').find(req.body).toArray(function (err, result) {
        if (err) throw err;
        res.send(JSON.stringify(result));
    });
});

//adapted from https://codeshack.io/basic-login-system-nodejs-express-mysql/

app.post('/auth', function (request, response) {
    // Capture the input fields
    let username = request.body.username;
    let password = request.body.password;
    // Ensure the input fields exists and are not empty
    if (username && password) {
        // Execute SQL query that'll select the account from the database based on the specified username and password
        db.collection("UserData").find({
            username: username,
            password: password
        }).toArray(function (error, results) {
            // If there is an issue with the query, output the error
            if (error) throw error;
            // If the account exists
            if (results.length > 0) {
                // Authenticate the user
                request.session.loggedin = true;
                request.session.username = username;
                // Redirect to home page
                response.redirect('/');
            } else {
                response.send('Incorrect Username and/or Password!');
            }
            response.end();
        });
    } else {
        response.send('Please enter Username and Password!');
        response.end();
    }
});

app.post('/logout', function (req, res) {
    req.session.loggedin = false;
    req.session.username = null;
});

app.get('/login', function (req, res) {
    res.render('./partials/login');
});