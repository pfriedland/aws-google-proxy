'use strict';

const express = require('express');
const request = require('request');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();
app.set('view engine', 'ejs');
app.get('*', (req, response) => {
	console.log("request path=" + JSON.stringify(req.path))
    console.log("request parameters=" + JSON.stringify(req.params))
    console.log("request query=" + JSON.stringify(req.query))
  	var path = '/search?q='+req.path.substr(1)
  	if (req.path === '/url' && req.query.q != null) {
  		// this is a google search result
  		// redirect to req.query.q
  		response.redirect(req.query.q)

  	}
  	else {
	   	var host = 'https://www.google.com'

		if ((req.path === '/search' || req.path === '/advanced_search') 
			&& req.query.q != null) {
		  	// this is an embedded search
		  	path = '/search?q=' + req.query.q
		  	// check to see if this is a pagination
		  	if (req.query.start != null) {
		  		path = path + '&start=' + req.query.start
		  	}
		}	   	
	 	console.log('google search path=' + path)

		request(host+path, 
			(error, resp, body) => 
		{
		    response.send(body)
		});

  	}

});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
