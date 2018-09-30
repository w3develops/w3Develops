/**
 * toggleHidden - a function and a closure to make the divID visible or
 *                invisible and toggle the button text also (as innerHTML).
 * make sure to use hidden or no class on these
 * more details: https://stackoverflow.com/questions/8941183
 */
var toggleHidden = function(divID) {
    return function (e) {
        var working = document.getElementById(divID);
        if (working.className=="hidden") {
            working.className="";
            e.target.innerHTML="Hide";
        } else {
            working.className="hidden";
            e.target.innerHTML="Show All";            
        }
    }
}

/**
 * html_include - a function that adds the url's contents and sets the innerHTML
 *                to the given placeholderID
 */
function html_include(placeholderID, url) {
    var XMLHTTP= XMLHttpRequest || ActiveXObject("Microsoft.XMLHTTP");
    if (typeof XMLHTTP!= "undefined" )
    {
    	var xmlhttp = new XMLHTTP;
    	xmlhttp.onreadystatechange= function() {
    		if(xmlhttp.readyState== 4) //4 is recv'd all responses
    		{
    			var resp = xmlhttp.responseText;
    			document.getElementById(placeholderID).innerHTML= resp;
    		}
    	}
    	xmlhttp.open("GET", url , true);
    	xmlhttp.send(null);
    }
    else
    	alert("Your browser doesn't seem to support ajax");
}

/**
 * html_append - a function that adds the url's contents and appends the innerHTML
 *               conserving any html content already present.
 */
function html_append(placeholderID, url) {
    var XMLHTTP= XMLHttpRequest || ActiveXObject("Microsoft.XMLHTTP");
    if (typeof XMLHTTP!= "undefined" )
    {
        var xmlhttp = new XMLHTTP;
        xmlhttp.onreadystatechange= function() {
            if(xmlhttp.readyState== 4) //4 is recv'd all responses
            {
                var resp = xmlhttp.responseText;
                document.getElementById(placeholderID).innerHTML += resp;
            }
        }
        xmlhttp.open("GET", url , true);
        xmlhttp.send(null);
    }
    else
        alert("Your browser doesn't seem to support ajax");
}
