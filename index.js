var express = require('express');
var app = express();
var MemoryStore = require('connect').session.MemoryStore;
var pg = require('pg').native;

// import the models
var models = {
    Model: require('./server/models/Model')(pg)
};

app.configure(function() {
    app.set('view engine', 'jade');
    app.use(express.static(__dirname + '/public'));
    app.use(express.limit('1mb'));
    app.use(express.bodyParser());
    app.use(express.cookieParser());

});

app.get('/', function(req, res) {
    res.render('index.jade');
});

app.get('/account/authenticated', function(req, res) {
    if ( req.session.loggedIn ) {
        res.send(200);
    } else {
        res.send(401);
    }
})

app.post('/login', function(req, res) {
    console.log('login request');
    var email = req.param('email', null);
    var password = req.param('password', null);

    if ( email == null || email.length < 1 || password == null || password.length < 1 ) {
        res.send(400);
        return;
    }

    models.Model.login(email, password, function(account) {
        if (!account) {
            res.send(400);
            return;
        }

        console.log('login was successful');
        req.session.loggedIn = true;
        req.session.accountId = account;
        res.send(200);
    });

});

app.post('/register', function(req, res) {

});

app.get('/logout', function(req, res) {

});


/****/
app.get('/accounts/:id', function(req, res) {

});

app.post('/items/search', function(req, res) {

});


app.listen(8080);
console.log("Application is at localhost:8080")
