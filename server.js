const express = require('express');
const app = express();
const url = require('url');
const ejs = require('ejs');
const fs = require('fs')
require('dotenv').config();
const get_img = require('./modules/get_img');
const path = require('path');
const router = express.Router();
const http = require('http');
const bodyParser = require('body-parser');
const route = require('./modules/route.js')

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('./public'));

const mClient = require('mongodb').MongoClient;

mClient.connect(process.env.uri, function (err, client) {
    if (err) throw err;
    db = client.db('CM4025');
    app.listen(8080);
    console.log("Running on 8080")
});

app.get('/', function (req, res) {
    res.render('index.ejs', {posts:posts});
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

var posts = 
[
    {
        post_title: 'Test0',
        img: './images/default.png',
        score: 0,
        datetime: '5/10/2022'
    },
    {
        post_title: 'Test1',
        img: './images/default.png',
        score: 3,
        datetime: '5/10/2022'
    }
];