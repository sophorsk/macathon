var express = require('express');
var app = express();
//var MemoryStore = require('connect').session.MemoryStore;
var MemoryStore = new express.session.MemoryStore();
var pg = require('pg').native;
var sha1 = require('sha1');

var Chance = require('chance');
var nodemailer = require("nodemailer");
var mail_credential = require('./config/mail.json');

var db;

db = require('./server/db')(pg, function () {

    app.configure(function () {
        app.set('view engine', 'jade');
        app.use(express.static(__dirname + '/public'));
        app.use(express.limit('1mb'));
        app.use(function (req, res, next) {
            console.log('%s %s', req.method, req.url);
            next();
        });
        app.use(express.bodyParser());
        app.use(express.cookieParser());
        app.use(express.session({
            secret: "macathonsecretkey",
            store: new MemoryStore()
        }));
    });

    app.get('/', function (req, res) {
        res.render('index.jade');
    });

    app.get('/api/account/authenticated', function (req, res) {
        if (req.session.account_id != undefined) {
            res.send(200);
        } else {
            res.send(401);
        }
    });

    /* API for registration */
    app.post('/api/register', function(req, res) {
        var email = req.param('email');
        var first_name = req.param('first_name');
        var last_name = req.param('last_name');
        var password = req.param('password');
        var photo = req.param('photo', null);

        // image manipulation here

        if (email == null || email.length < 1) {
            res.send(400, "Email is not valid !");
            return;
        }

        if (password == null || password.length < 1) {
            res.send(400, "Password is not valid !");
            return;
        }

        var password_hash = sha1(password);
        // generate pending key using Chance, then add to registration
        var chance = new Chance();
        var pending_key = chance.hash({length: 15});
        var verified = false;

        db.register(email, password_hash, first_name, last_name, pending_key, verified, function(err) {
            if (err) {
                res.send(500, err);
            } else {
                req.session.account_id = undefined;
                // send account verification email
                sendEmail(email, pending_key);
                console.log('Registration has been completed!');
                res.send(200);
            }
        });
    });

    /* API for authentication */
    app.post('/api/login', function (req, res) {
        var email = req.param('email');
        var password = req.param('password');

        if (!email) {
            res.send(400, "email must be specified!");
            return;
        }

        if (!password) {
            res.send(400, "password must be specified!");
            return;
        }

        var password_hash = sha1(password);

        db.login(email, password_hash, function (err, account) {
            if (err) {
                res.send(500, err);
            } else {
                if (account.verified) {
                    console.log('Logged in account %s successfully!', email);
                    req.session.account_id = account.id;
                    res.send(200);
                }
            }
        });
    });

    /* API for logout */
    app.get('/api/logout', function (req, res) {
        if (req.session) {
            req.session.destroy();
            req.session = undefined;
        }
        res.redirect('/');
    });

    /* Register verification */
    app.get('/verify/:key', function(req, res) {
        var pending_key = req.param("key");
        db.verifyRegistration(pending_key, function(err) {
            if (err) {
                res.send(404, err);
            } else {
                res.redirect('#index');
            }
        });
    });

    /***
     * All APIs for users
     */
    function getAccountInfo(req, res, account_id) {
        db.findAccountById(account_id, function (err, account) {
            if (err) {
                res.send(404, err);
            } else {
                account.password_sha1 = undefined;
                //account.pending_key = undefined;
                //account.email_address = undefined;
                console.log(account);

                res.send(account);
            }
        });
    }

    /* Get information about the currently logged in account.  */
    app.get('/api/accounts/me', function (req, res) {
        var account_id = req.session.account_id;
        if (account_id == undefined) {
            res.send(401, "no account is currently logged in!");
            return;
        }
        getAccountInfo(req, res, account_id);
    });

    /* Get information about an account specified by ID.  */
    app.get('/api/accounts/:account_id', function (req, res) {
        getAccountInfo(req, res, req.param('account_id'));
    });

    function getItemsForSale(req, res, seller_id) {
        db.findItemsBySeller(seller_id, function (err, result) {
            if (err) {
                res.send(500, err);
            } else {
                res.send(result);
            }
        });
    }

    /* Get the items for sale by the currently logged in account.  */
    app.get('/api/accounts/me/items', function (req, res) {
        var seller_id = req.session.account_id;
        if (seller_id == undefined) {
            res.send(401, "no account is currently logged in!");
            return;
        }
        getItemsForSale(req, res, seller_id);
    });

    /* Get the items for sale by the specified account.  */
    app.get('/api/accounts/:account_id/items', function (req, res) {
        getItemsForSale(req, res, req.param.account_id);
    });


    /***
     * All APIs for items
     */

    /* Search the items by category and search string.  */
    app.get('/api/items', function (req, res) {

        var account_id = req.session.account_id;

        var search_category = req.param('category');
        var search_text = req.param('q');

        db.searchItems(search_category, search_text, function (err, items) {
            if (err) {
                res.send(500, err);
            } else {
                res.send(items);
            }
        });
    });

    /* Post an item for sale using the currently logged in account.  */
    app.post('/api/post_item', function (req, res) {
        var account_id = req.session.account_id;

        if (account_id == undefined) {
            res.send(401, "no account is currently logged in!");
            return;
        }

        var item = {
            name: req.param('name'),
            category: req.param('category'),
            description: req.param('description'),
            price_in_cents: req.param('price_in_cents')
        };

        console.log(item);

        db.postItem(account_id, item, function (err) {
            if (err) {
                res.send(500, err);
            } else {
                res.send(200);
            }
        });
    });

    /* Get information about the specified item.  */
    app.get('/api/item/:item_id', function (req, res) {
        var item_id = req.param('item_id');
        db.findItemById(item_id, function (err, item) {
            if (err) {
                res.send(404, err);
            } else {
                res.send(item);
            }
        });
    });

    /* Make an offer on the specified item using the currently logged in account.
     */
    app.post('/api/item/:item_id/make_offer', function (req, res) {
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

        db.makeOffer(item_id, account_id, price_in_cents, function (err) {
            if (err) {
                res.send(500, err);
            } else {
                res.send(200);
            }
        });
    });

    /* Delete the specified item, which must be owned by the currently logged in account.  */
    app.delete('/api/item/:item_id', function (req, res) {
        var account_id = req.session.account_id;

        if (account_id == undefined) {
            res.send(401, "no account is currently logged in!");
            return;
        }

        var item_id = req.param('item_id');

        db.deleteItem(account_id, item_id, function (err) {
            if (err) {
                res.send(500, err);
            } else {
                res.send(200);
            }
        });
    });

    /**
     * APIs for messaging
     */

    /* Get all messages that have been sent to the currently logged in account.  */
    app.get('/api/messages', function (req, res) {
        var account_id = req.session.account_id;

        if (account_id == undefined) {
            res.send(401, "no account is currently logged in!");
            return;
        }

        db.getIncomingMessages(account_id, function (err, messages) {
            if (err) {
                res.send(500, err);
            } else {
                res.send(messages);
            }
        });
    });

    /* Send a message from the currently logged in account to the specified account */
    app.post('/api/send_message/:to_account_id', function (req, res) {
        var from_account_id = req.session.account_id;

        if (from_account_id == undefined) {
            res.send(401, "no account is currently logged in!");
            return;
        }

        var message_text = req.param('message_text');
        var to_account_id = req.param('to_account_id');

        if (!message_text || to_account_id == undefined) {
            res.send(400, "message_text and to_account_id must be specified!");
            return;
        }

        if (message_text.length > 2000) {
            res.send(400, "message length is limited to 2000 characters!");
            return;
        }

        db.sendMessage(message_text, from_account_id, to_account_id, function (err) {
            if (err) {
                res.send(500, err);
            } else {
                res.send(200);
            }
        });
    });

    /* Send email from shareMe to a recipient */
    function sendEmail(recipient, verified_string)  {
        var smtpTransport = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: mail_credential.email,
                pass: mail_credential.password
            }
        });

        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: "COBO team <cobo.at.mac@gmail.com>", // sender address
            to: recipient, // list of receivers
            subject: "COBO account Registration", // Subject line
            text: "Hello user: " + verified_string, // plaintext body
            html: "<div> Dear user </div> " +
                "<p> Please verify your registration at the following link: </p>" +
                "localhost:8080/verify/" + verified_string +   // for testing purposes
                "<br>" +
                "<br>" +
                "<div> Thank you, </div>" + // html body
                "<div> COBO team </div>"
        }

        // send mail with defined transport object
        smtpTransport.sendMail(mailOptions, function(error, response){
            if(error){
                console.log(error);
            }else{
                console.log("Message sent: " + response.message);
            }

            smtpTransport.close(); // shut down the connection pool, no more messages
        });
    }

    app.listen(8080);
    console.log("Server listening at localhost:8080");
});
