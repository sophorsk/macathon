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

app.get('/api/account/authenticated', function(req, res) {
    if (req.session.account_id != undefined) {
        res.send(200);
    } else {
        res.send(401);
    }
})

app.post('/api/login', function(req, res) {
    console.log('login request');

    var email = req.param('email');
    var password = req.param('password');

    if (email == null || email.length < 1) {
        res.send(400, "email must be specified!");
        return;
    }

    if (password == null || password.length < 1) {
        res.send(400, "password must be specified!");
        return;
    }

    var password_hash = sha1(password);

    db.login(email, password_hash, function(err, account) {
        if (err) {
            res.send(500, err);
        } else {
            console.log('Logged in account %s successfully!', email);
            req.session.account_id = account.id;
            res.send(200);
        }
    });

});

app.get('/api/logout', function(req, res) {
    if (req.session) {
        req.session.auth = null;
        req.session.destroy();
    }
    res.redirect('/');
});


/***
 * All APIs for users
 */

function getAccountInfo(req, res, account_id) {
    db.findAccountById(account_id, function(err, account) {
        if (err) {
            res.send(404);
        } else {
            console.log(account);

            account.password_sha1 = undefined;
            account.pending_key = undefined;
            account.email_address = undefined;

            res.send(account);
        }
    });
}

/* Get information about the currently logged in account.  */
app.get('/api/accounts/me', function(req, res) {
    var account_id = req.session.account_id;
    if (account_id == undefined) {
        res.send(401, "no account is currently logged in!");
        return;
    }
    getAccountInfo(req, res, account_id);
});

/* Get information about an account specified by ID.  */
app.get('/api/accounts/:account_id', function(req, res) {
    var account_id = req.param('account_id');
    if (account_id == undefined) {
        res.send(400, "account_id must be specified!");
        return;
    }
    getAccountInfo(req, res, account_id);
});

function getItemsForSale(req, res, seller_id) {
    db.findItemsBySeller(seller_id, function(err, result) {
        if (err) {
            res.send(500, err);
        } else {
            res.send(result);
        }
    });
}

/* Get the items for sale by the currently logged in account.  */
app.get('/api/accounts/me/items', function(req, res) {
    var seller_id = req.session.account_id;
    if (seller_id == undefined) {
        res.send(401, "no account is currently logged in!");
        return;
    }
    getItemsForSale(req, res, seller_id);
});

/* Get the items for sale by the specified account.  */
app.get('/api/accounts/:account_id/items', function(req, res) {
    var seller_id = req.param('account_id');
    if (seller_id == undefined) {
        res.send(400, "account_id must be specified!");
        return;
    }
    getItemsForSale(req, res, seller_id);
});


/***
 * All APIs for items
 */

/* Search the items by category and search string.  */
app.get('/api/items', function(req, res) {

    var search_category = req.param('category');
    var search_text = req.param('q');

    db.searchItems(search_category, search_text, function(err, items) {
        if (err) {
            res.send(500, err);
        } else {
            res.send(items);
        }
    });
});

/* Post an item for sale using the currently logged in account.  */
app.post('/api/post_item', function(req, res) {
    var account_id = req.session.account_id;

    if (account_id == undefined) {
        res.send(401, "no account is currently logged in!");
        return;
    }

    var item = {
        name: req.param('name'),
        category: req.param('category'),
        description: req.param('description'),
        price_in_cents: req.param('price_in_cents'),
        picture : null,
    };

    db.postItem(account_id, item, function(err) {
        if (err) {
            res.send(500, err);
        } else {
            res.send(200);
        }
    });
});

/* Get information about the specified item.  */
app.get('/api/items/:item_id', function(req, res) {
    var item_id = req.param('item_id');
    db.findItemById(item_id, function(err, item) {
        if (err) {
            res.send(404, err);
        } else {
            res.send(item);
        }
    });
});

/* Make an offer on the specified item using the currently logged in account.
 */
app.post('/api/item/:item_id/make_offer', function(req, res) {
    var account_id = req.session.account_id;
    if (account_id == undefined) {
        res.send(401, "no account is currently logged in!");
        return;
    }

    var item_id = req.param('item_id');
    var price_in_cents = req.param('price_in_cents');

    if (price_in_cents == undefined) {
        res.send(400, "price_in_cents must be specified!");
        return;
    }

    db.makeOffer(item_id, account_id, price_in_cents, function(err) {
        if (err) {
            res.send(400, err);
        } else {
            res.send(200);
        }
    });
});

app.delete('/api/items', function(req, res) {
    var account_id = req.session.account_id;
    var itemId = req.param('itemId');

    db.deleteItem(account_id, itemId, function(err) {
        res.send(err ? 400 : 200);
    });
});

/**
 * APIs for messaging
 */
// load all messages for a user
app.get('/api/messages', function(req, res) {
    var account_id = req.session.account_id;

    db.getIncomingMessages(account_id, function(err, messages) {
        res.send(err ? 404 : messages);
    });
});

app.post('/api/send_message/:to_account_id', function(req, res) {

    var message_text = req.param('message_text');
    var from_account_id = req.session.account_id;
    var to_account_id = req.param('to_account_id');

    db.sendMessage(message_text, from_account_id, to_account_id, function(err) {
        res.send(err ? 400 : 200);
    });
});


app.listen(8080);
console.log("Application is at localhost:8080")

});
