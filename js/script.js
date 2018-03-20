$(document).ready(function() {
	var myTaglines = new Array();
	
	myTaglines[0] = "A place for developers";
	myTaglines[1] = "Where developers collaborate";
	myTaglines[2] = "learn+build=developer";
	myTaglines[3] = "Learn to build, build to learn";
	
	var myRandomQuote = Math.floor(Math.random()*myTaglines.length);

	$("#taglines").html(myTaglines[myRandomQuote]);
	
});
