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
var ObjectId = require('mongodb').ObjectId;


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
            id = new ObjectId(req.session.userid);
            db.collection('UserData').findOne({"_id": id}, function (err, result) {
                if (err) throw err;
                user = JSON.parse(JSON.stringify(result));
                res.render('index', {
                    posts: posts,
                    username: user.username,
                    likes: user.likes,
                    session: req.session
                });
            });
        } else {
            res.render('index', {
                posts: posts,
                session: req.session
            });
    
        }
    });
});

app.get('/game', function (req, res) {
    db.collection('Posts').find(req.body).toArray(function (err, result) {

        posts = JSON.parse(JSON.stringify(result));
        res.render('game', {
            posts: posts,
            session: req.session
        });
    });
});

app.get('/profile', function (req, res) {
    if (req.session.loggedin) {
        id = new ObjectId(req.session.userid);
        db.collection('UserData').findOne({"_id": id}).toArray(function (err, result) {
            if (err) throw err;
            user = JSON.parse(JSON.stringify(result));
            res.render('profile', {
                user: user,
                session: req.session
            });
        });
    } else {
        res.render('./login');
    }
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
                request.session.userid = results[0]._id;
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

app.post('/newUser', function (request, response) {
    // Capture the input fields
    let username = request.body.username;
    let password = request.body.password;
    // Ensure the input fields exists and are not empty
    if (username && password) {
        // Execute SQL query that'll select the account from the database based on the specified username and password
        db.collection("UserData").insertOne({
            username: username,
            password: password,
            admin: false
        }, function (error, result) {
            if (error) throw error;
            console.log("new user added")
        });
    } else {
        response.send('Please enter Username and Password!');
        response.end();
    }
});

app.post('/logout', function (req, res) {
    if (req.session.user) {
        delete req.session.user;
        req.session.loggedin = false;
        res.redirect('/')
    }
});

app.get('/login', function (req, res) {
    res.render('./login');
});

app.post('/like/:_id', function (req, res) {
    _id = new ObjectId(req.params._id);
    let q = { "_id": _id };
    db.collection("Posts").findOne(q, function (err, result) {
        if (err) throw err;
        if (result) {
            newscore = result.score + 1;
            db.collection("Posts").updateOne(q, { $set: {score: newscore }}, function (err, result) {
                if (err) throw err;
                if (result) {
                    userid = new ObjectId(req.session.userid);
                    let q = { "_id": userid };
                    db.collection("UserData").updateOne(q, {$push: {likes: _id}}, function (err, result) {
                        if (err) throw err;
                        if (result) {
                            res.redirect('/');
                        } else {
                            res.send('Failed to update database');
                        }
                    })
                } else {
                    res.send('Failed to update database');
                }
            });
        } else {
            res.send('Post does not exist');
        }
    })
});

app.post('/unlike/:_id', function (req, res) {
    _id = new ObjectId(req.params._id);
    let q = { "_id": _id };
    db.collection("Posts").findOne(q, function (err, result) {
        if (err) throw err;
        if (result) {
            newscore = result.score - 1;
            db.collection("Posts").updateOne(q, { $set: {score: newscore }}, function (err, result) {
                if (err) throw err;
                if (result) {
                    userid = new ObjectId(req.session.userid);
                    let q = { "_id": userid };
                    db.collection("UserData").updateOne(q, {$pull: {likes: _id}}, function (err, result) {
                        if (err) throw err;
                        if (result) {
                            res.redirect('/');
                        } else {
                            res.send('Failed to update database');
                        }
                    })
                } else {
                    res.send('Failed to update database');
                }
            });
        } else {
            res.send('Post does not exist');
        }
    })
});

app.post('/newPost', function (request, response) {
    // Capture the input fields
    let post_title = request.body.post_title;
    let img_name = request.body.img_name;
    let score = 0;
    let username = request.session.user.username;
    let dt = new Date()
    let datetime = dt.toISOString();
    let comments = [];

    // Ensure the input fields exists and are not empty
    if (username && post_title && img_name) {
        // Execute SQL query that'll select the account from the database based on the specified username and password
        db.collection("Posts").insertOne({
            datetime: datetime,
            post_title: post_title,
            img_name: img_name,
            score: score,
            username: username,
            comments: comments
        }, function (err, res) {
            if (err) throw err;
            console.log("new post added");
        })
    } else {
        response.send("Can't send an empty post!");
        response.end();
    }
});

app.post('/addComment/:_id', function (req, res) {
    _id = new ObjectId(req.params._id);
    let q = { "_id": _id };
    if (req.session.loggedin) {
        db.collection("Posts").findOne(q, function (err, result) {
            if (err) throw err;
            if (result) {
                let content = req.body.comment;
                let username = req.session.username
                let dt = new Date()
                let datetime = dt.toISOString();
                if (content) {
                    db.collection("Posts").updateOne(q, {
                        "$push":
                        {
                            comments: {
                                username: username,
                                datetime: datetime,
                                content: content
                            }
                        }
                    }, function (err, result) {
                        if (err) throw err;
                        if (result) {
                            console.log("comment added successfully");
                            res.redirect('/')
                        }
                    });
                } else {
                    res.send('Need comment content')
                }
            } else {
                res.send('Post does not exist');
            }
        });
    } else {
        res.redirect('/login')
    }

});
