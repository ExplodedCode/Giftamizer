const path = require('path');
var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var api = express();

api.use(
	cors({
		origin: 'http://localhost:3000',
		optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
	})
);

api.use(express.static(path.join(__dirname, '/build')));

// Body Parser Middleware
api.use(bodyParser.json());

//Setting up server and SQL Connection
(async function () {
	var mysql = require('mysql');
	var giftConnection = mysql.createConnection({
		host: '***REMOVED***',
		user: 'giftamizer', //ALTER USER 'giftamizer'@'localhost' IDENTIFIED WITH mysql_native_password BY '***REMOVED***'
		password: '***REMOVED***',
	});
	giftConnection.connect(function (err) {
		if (err) throw err;
		console.log('Connected!');
		start(giftConnection);
	});
})();

async function start(giftConnection) {
	var server = api.listen(process.env.PORT || 8080, function () {
		var port = server.address().port;
		console.log('App now running on port', port);
	});

	// Create User
	var User_Controller = require('./controllers/User')(giftConnection);
	api.get('/api/user/create', User_Controller.create);

	// Handles any requests that don't match the ones above
	api.get('*', async (req, res) => {
		try {
			res.sendFile(path.join(__dirname + '/build/index.html'));
		} catch (error) {
			console.error(error.message);
			response.status(500).send(error);
		}
	});
}
