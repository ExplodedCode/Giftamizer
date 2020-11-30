const path = require('path');
var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');

var api = express();

api.use(
	cors({
		origin: '*',
		optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
	})
);

api.use(express.static(path.join(__dirname, '/build')));

// Body Parser Middleware
api.use(bodyParser.json());

//Setting up server and SQL Connection
(async function () {
	start();
})();

async function start() {
	try {
		var server = api.listen(process.env.PORT || 8080, function () {
			var port = server.address().port;
			console.log('App now running on port', port);
		});

		// Microsoft Graph
		var Metadata = require('./controllers/Metadata')(null, null);
		api.get('/api/metadata', Metadata.get);

		//
		//
		//
		//
		//
		//
		// Handles any requests that don't match the ones above
		api.get('*', async (req, res) => {
			try {
				res.sendFile(path.join(__dirname + '/build/index.html'));
				console;
			} catch (error) {
				console.error(error.message);
				response.status(500).send(error);
			}
		});
	} catch (error) {
		console.log(error);
	}
}
