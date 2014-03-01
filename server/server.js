var express = require("express");
var app = express();

var models = {
	Model: require('./models/Model')
};

app.configure(function() {
	app.use(express.bodyParser());
	app.use(express.cookieParser());
});

