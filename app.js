var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));

app.get("/", function(req, res) {
	res.render('home.ejs');
});

app.get("/login", function(req, res) {
	res.render('login.ejs');
});



app.listen(3000, function(){
	console.log('server running on port 3000');
});

