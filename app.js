var express = require('express');
var app = express();

app.use(express.static('public'));

app.get("/", function(req, res) {
	res.render('home.ejs');
});

app.get("/login", function(req, res) {
	res.render('login.ejs');
});



app.listen(3000, function(){
	console.log('server running on port 3000');
});

