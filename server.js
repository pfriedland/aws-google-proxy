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
  // res.send('Hello world\n');
  // console.log(req.path)

  	if (req.path === '/url' && req.query.q != null) {
  		// redirect to req.query.q
  		response.redirect(req.query.q)
  	}
  	else {
	   	var host = 'https://www.google.com'
	 	var path = '/search?q='+req.path.substr(1)

		// var optionsget = {
		//             headers: {
		//                 'authority': host,
		//                 'method': 'GET',
		//                 'path': path,
		//                 'Referer': 'https://www.google.com'
		//             },
		//             url: host+path,
		//             method: 'GET'
		//         };

		request(host+path, 
			(error, resp, body) => 
		{
		    response.send(body)
		});

  	}





});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
