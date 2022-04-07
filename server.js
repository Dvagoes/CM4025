var express = require('express');
var app = express();
var url = require('url');


app.set('view engine', 'ejs');


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://dvagoes:<password>@cm4025.zjs6v.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const mClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

mClient.connect(url, function (err, client) {
    if (err) throw err;
    db = client.db('CM4025');
    app.listen(8080);
    console.log("Running on 8080")
});

app.get('/', function (req, res) {
    res.render('assets/pages/index.ejs');
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
