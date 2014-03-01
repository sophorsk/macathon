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
    app.use(express.session({
        secret: "",
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
    var accountId = req.sessions.accountId;

    models.Model.findUserById(accountId, function(account) {
        console.log(account);
        res.send(account);
    })
});

app.post('/accounts/:id/item', function(req, res) {
    var accountId = req.session.accountId;

    models.Model.findUserById(accountId, function(account) {
        var item = {
            itemName: req.param('itemName', ''),
            itemDescription: req.param('itemDescription', ''),
            price: req.param('price', ''),
            category: req.param('category', ''),
            timePosted: req.param('timePosted', '')
        }

        // change here
        models.Model.postItem(accountId, item, function(object) {
            res.send(object);
        });
    });
});


/***
 * All APIs for items
 */
app.get('/items/all', function(req, res) {
    models.Model.loadAllItems(function(allItems) {
        console.log(allItems);
        res.send(allItems);
    })
});

app.get('/items/:id', function(req, res) {
    var accountId = req.session.accountId;

    var itemId = req.param('itemId', null);
    models.Model.findItemById(itemId, function(item) {
        console.log(item);
        res.send(item);
    });
});

app.post('/items/search', function(req, res) {
    var searchString = req.param('searchString', null);
    var category = req.param('category', null);
    var filter = req.param('filter', null);

    if (searchString == null) {
        res.send(400);
        return;
    }

    models.Model.searchItems(searchString, category, function(err, items) {
        if (err || items.length == 0) {
            res.send(404);
        } else {
            res.send(items);
        }
    })
});


/**
 * APIs for messaging
 */
app.get('/accounts')



app.listen(8080);
console.log("Application is at localhost:8080")
