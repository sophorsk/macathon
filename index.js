var express = require('express');
var app = express();
var MemoryStore = require('connect').session.MemoryStore;

app.configure(function() {
    app.set('view engine', 'jade');
    app.use(express.static(__dirname + '/public'));
    app.use(express.limit('1mb'));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({
        secret: "PartyFinder secret key",
        store: new MemoryStore()
    }));
});

app.get('/', function(req, res) {
    res.render('index.jade');
});

app.listen(8080);
console.log("Application is at localhost:8080")
