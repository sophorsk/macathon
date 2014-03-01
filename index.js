var express = require('express');
var http = require('http');
var app = express();

app.set('port', 8080);
app.use(express.bodyParser());
app.use(express.cookieParser());

http.createServer(app).listen(app.get('port'), function(){
	console.log('Server listening on port ' + app.get('port'));
})
