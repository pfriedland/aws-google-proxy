'use strict';

const express = require('express');
const request = require('request');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();

app.get('*', (req, response) => {
		console.log("request path=" + JSON.stringify(req.path))
    console.log("request parameters=" + JSON.stringify(req.params))
    console.log("request query=" + JSON.stringify(req.query))



  	if (req.path === '/url' && req.query.q != null) {
  		// this is a google search result
  		// redirect to req.query.q
  		response.redirect(req.query.q);

  	}
  	else {
			var path = '/search?q='+req.path.substr(1);
	   	var host = 'https://www.google.com';

			if ((req.path === '/search' || req.path === '/advanced_search')
				&& req.query.q != null) {
			  	// this is an embedded search
			  	path = '/search?q=' + req.query.q
			  	// check to see if this is a pagination
			  	if (req.query.start != null) {
			  		path = path + '&start=' + req.query.start
			  	}
					// is this is time-based search?
					else if (req.query.tbs != null) {
						path = path + '&tbs=' + req.query.tbs
					}
					// is this is a images, video, news, shopping, books query?
					if (req.query.tbm != null ){
						path = path + '&tbm=' + req.query.tbm
					}
			}
		 	console.log('google search path=' + path)
			// make the search request to www.google.com
			request(host+path,
				(error, resp, body) =>
			{
			    response.send(body)
			});

  	}

});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
