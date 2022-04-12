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
var formidable = require('formidable')
const crypto = require('crypto');

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
    port = process.env.PORT || '8080'
    app.listen(port);
    console.log("Running on", port)
});

app.get('/', function (req, res) {
    db.collection('Posts').find(req.body).sort({ datetime: -1 }).toArray(function (err, result) {
        if (err) throw err;
        posts = JSON.parse(JSON.stringify(result));
        if (req.session.loggedin) {
            id = new ObjectId(req.session.userid);
            db.collection('UserData').findOne({ "_id": id }, function (err, result) {
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
        db.collection('UserData').findOne({ "_id": id }, function (err, result) {
            if (err) throw err;
            user = JSON.parse(JSON.stringify(result));
            res.render('profile', {
                user: user,
                session: req.session
            });
        });
    } else {
        res.redirect('/login');
    }
});

app.get("/getUserData", function (req, res) {
    db.collection('UserData').find(req.body).toArray(function (err, result) {
        if (err) throw err;
        res.send(JSON.stringify(result));
    });
});

app.get("/getPosts", function (req, res) {
    db.collection('Posts').find(req.body).sort({ datetime: -1 }).toArray(function (err, result) {
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
        db.collection("UserData").find({ username: username }, function (err, res) {
            if (err) throw err;

            if (res.length > 0) {
                response.send("User already exists");
            } else {
                db.collection("UserData").insertOne({
                    username: username,
                    password: password,
                    admin: false,
                    posts: 0,
                    score: 0,
                    likes: []
                }, function (error, result) {
                    if (error) throw error;
                    console.log("new user added", username)
                });
            }
        })
    } else {
        response.send('Please enter Username and Password!');
        response.end();
    }
});

app.post('/logout', function (req, res) {
    if (req.session.userid) {
        delete req.session.userid;
        req.session.loggedin = false;
        res.redirect('back')
    }
});

app.get('/login', function (req, res) {
    res.render('./login');
});

app.get('/signup', function (req, res) {
    res.render('./signup');
});

app.post('/like/:_id', function (req, res) {
    _id = new ObjectId(req.params._id);
    let q = { "_id": _id };
    db.collection("Posts").findOne(q, function (err, result) {
        if (err) throw err;
        if (result) {
            newscore = result.score + 1;
            db.collection("Posts").updateOne(q, { $set: { score: newscore } }, function (err, result) {
                if (err) throw err;
                if (result) {
                    userid = new ObjectId(req.session.userid);
                    let q = { "_id": userid };
                    db.collection("UserData").updateOne(q, { $push: { likes: _id } }, function (err, result) {
                        if (err) throw err;
                        if (result) {
                            res.redirect('back');
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
            db.collection("Posts").updateOne(q, { $set: { score: newscore } }, function (err, result) {
                if (err) throw err;
                if (result) {
                    userid = new ObjectId(req.session.userid);
                    let q = { "_id": userid };
                    db.collection("UserData").updateOne(q, { $pull: { likes: _id } }, function (err, result) {
                        if (err) throw err;
                        if (result) {
                            res.redirect('back');
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
    let form = new formidable.IncomingForm({
        uploadDir: __dirname + '/tmp',
        keepExtensions: true
    });
    form.parse(request, function (err, fields, files) {
        if (err) throw err;
        let img = files.image.filepath;
        console.log(img);
        newFilePath = "./public/images/" + files.image.originalFilename;
        fs.rename(img, newFilePath, function (err) {
            if (err) throw err;
            if (request.session.loggedin) {
                userid = new ObjectId(request.session.userid);
                let q = { "_id": userid };
                db.collection("UserData").findOne(q, function (err, result) {
                    if (err) throw err;
                    if (result) {

                        let img_name = "./images/" + files.image.originalFilename;
                        let username = result.username;
                        let post_title = fields.title;
                        let score = 0;
                        let dt = new Date()
                        // Ensure the input fields exists and are not empty
                        if (username && post_title && img_name) {
                            // Execute SQL query that'll select the account from the database based on the specified username and password
                            db.collection("Posts").insertOne({
                                datetime: dt,
                                post_title: post_title,
                                img_name: img_name,
                                score: score,
                                username: username,
                                comments: []
                            }, function (err, res) {
                                if (err) throw err;
                                console.log("new post added");
                                response.redirect('back')
                            })
                        } else {
                            response.send("Upload Failed");
                            response.end();
                        }
                    }
                })
            }
        })
    })


});

app.post('/addComment/:_id', function (req, res) {

    if (req.session.loggedin) {
        userid = new ObjectId(req.session.userid);
        let q = { "_id": userid };
        db.collection("UserData").findOne(q, function (err, result) {
            if (err) throw err;
            if (result) {
                let username = result.username;
                _id = new ObjectId(req.params._id);
                let q = { "_id": _id };

                db.collection("Posts").findOne(q, function (err, result) {
                    if (err) throw err;
                    if (result) {
                        let content = req.body.comment;
                        let dt = new Date()
                        if (content) {
                            db.collection("Posts").updateOne(q, {
                                "$push":
                                {
                                    comments: {
                                        username: username,
                                        datetime: dt,
                                        content: content
                                    }
                                }
                            }, function (err, result) {
                                if (err) throw err;
                                if (result) {
                                    console.log("comment added successfully");
                                    res.redirect('back')
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
                res.send('Failed to find user');
            }
        })

    } else {
        res.redirect('/login')
    }

});

// adapted from https://blog.logrocket.com/node-js-crypto-module-a-tutorial/
