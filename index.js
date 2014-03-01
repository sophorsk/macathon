var express = require('express');
var app = express();
var MemoryStore = require('connect').session.MemoryStore;
var pg = require('pg').native;
var sha1 = require('sha1');

var db;

db = require('./server/db')(pg, function(){

app.configure(function() {
    app.set('view engine', 'jade');
    app.use(express.static(__dirname + '/public'));
    app.use(express.limit('1mb'));
    app.use(function(req, res, next) {
        console.log('%s %s', req.method, req.url);
        next();
    });
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({
        secret: " ",
        store: new MemoryStore()
    }));
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
    var email = req.param('email');
    var password = req.param('password');

    if ( email == null || email.length < 1 || password == null || password.length < 1 ) {
        res.send(400);
        return;
    }

    var password_hash = sha1(password);

    db.login(email, password_hash, function(err, account) {
        if (err) {
            res.send(400);
            return;
        }

        console.log('login was successful');
        req.session.loggedIn = true;
        req.session.accountId = account.id;
        res.send(200);
    });

});

app.get('/logout', function(req, res) {
    if (req.session) {
        req.session.auth = null;
        req.session.destroy();
        res.redirect('/');
    }
});

/***
 * All APIs for users
 */
app.get('/accounts/:id', function(req, res) {
    var accountId = req.session.accountId;

    db.findUserById(accountId, function(account) {
        console.log(account);
        res.send(account);
    })
});

app.get('/accounts/me', function(req, res) {

});

app.post('/accounts/:id/item', function(req, res) {
    var accountId = req.session.accountId;

    var item = {
        name: req.param('name'),
        category: req.param('category'),
        description: req.param('description'),
        price_in_cents: req.param('price_in_cents'),
        picture : null,
    };

    db.postItem(accountId, item, function(err) {
        res.send(err ? 400 : 200);
    });
});


/***
 * All APIs for items
 */

app.get('/items', function(req, res) {

    var search_category = req.param('category');
    var search_text = req.param('q');

    db.searchItems(search_category, search_text, function(err, items) {
        if (err || items.length == 0) {
            res.send(404);
        } else {
            res.send(items);
        }
    });
});

app.get('/items/:itemId', function(req, res) {
    var accountId = req.session.accountId;

    var itemId = req.param('itemId');
    db.findItemById(itemId, function(err, item) {
        res.send(err ? 404 : item);
    });
});

app.post('/items', function(req, res) {
    var accountId = req.session.accountId;

    var itemId = req.param('itemId');
    var price_in_cents = req.param('price_in_cents');

    db.makeOffer(itemId, accountId, price_in_cents, function(err) {
        res.send(err ? 400 : 200);
    });
});

app.delete('/items', function(req, res) {
    var accountId = req.session.accountId;
    var itemId = req.param('itemId');

    db.deleteItem(accountId, itemId, function(err) {
        res.send(err ? 400 : 200);
    });
});


/**
 * APIs for messaging
 */
// load all messages for a user
app.get('/messages', function(req, res) {
    var accountId = req.session.accountId;

    db.getIncomingMessages(accountId, function(err, messages) {
        res.send(err ? 404 : messages);
    });
});

app.post('/sendmsg/:id', function(req, res) {

    var message_text = req.param('text');
    var from_account_id = req.session.accountId;
    var to_account_id = req.param('recipient');

    db.sendMessage(message_text, from_account_id, to_account_id, function(err) {
        res.send(err ? 400 : 200);
    });
});


app.listen(8080);
console.log("Application is at localhost:8080")

});
