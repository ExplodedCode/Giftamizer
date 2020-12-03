const path = require('path');
var express = require('express');
const http = require('http');
var cors = require('cors');
var bodyParser = require('body-parser');

const port = process.env.PORT || 8080;

const socketIO = require('socket.io');
var connection_string = 'mongodb://root:***REMOVED***@***REMOVED***:27017/Giftamizer?authSource=admin';

var app = express();
app.use(
	cors({
		origin: '*',
		optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
	})
);

app.use(express.static(path.join(__dirname, '/build')));

// Body Parser Middleware
app.use(bodyParser.json());

//Setting up server and SQL Connection
(async function () {
	// connect to MongoDB
	const db = require('monk')(connection_string);
	const server = http.createServer(app);

	const io = socketIO(server, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST'],
		},
	});

	start(db, server, io);
})();

async function start(db, server, io) {
	try {
		// start server
		server.listen(port, () => console.log(`Listening on port ${port}`));

		// Item Metadata
		var Metadata = require('./controllers/Metadata')(null, null);
		app.get('/api/metadata', Metadata.get);

		//
		//
		//
		//
		//
		//
		// ============================================ ▽ MongoDB ▽
		io.on('connection', (socket) => {
			// console.log('New Connected ' + socket.id);

			// join room (subscribe to socket channel)
			socket.on('join', function (room) {
				socket.join(room);
			});
			socket.on('leave', function (room) {
				socket.leave(room);
			});

			//
			// ============================================ ▽ User Data ▽
			const collection_users = db.get('users'); // initialize collection

			// get user data
			socket.on('req:userData', (userId) => {
				collection_users.findOne({ uid: userId }).then((doc) => {
					io.to(socket.id).emit('res:userData', doc);
				});
			});

			// add user data
			socket.on('add:userData', (reqData) => {
				collection_users.insert({ ...reqData }).then(() => {
					console.log('New User! ' + reqData.uid + ' - ' + reqData.displayName + ' - ' + reqData.email);
				});
			});

			// ============================================ △ User Data △
			//

			//
			// ============================================ ▽ Group Data ▽
			const collection_groups = db.get('groups'); // initialize collection

			// get user groups
			socket.on('req:groupsData', (userId) => {
				collection_groups.find({ members: userId }).then((doc) => {
					io.to(socket.id).emit('res:groupsData', doc);
				});
			});

			// create group
			socket.on('add:group', (reqData) => {
				collection_groups.insert({ ...reqData }).then(() => {
					console.log('New Group! ' + reqData.id + ' - ' + reqData.name);
				});
			});

			// set group
			socket.on('set:group', (data) => {
				collection_groups.findOne({ id: data.id }).then((doc) => {
					if (doc && doc.owner === data.editor) {
						delete data.owner;
						collection_groups.update({ id: data.id }, { $set: { ...data } }).then(() => {
							// ====================================================== needs emit to group members view!!
							io.to(socket.id).emit('res:set:group', 'ok');
						});
					} else {
						io.to(socket.id).emit('res:set:group', 'notfound');
					}
				});
			});

			// join group
			socket.on('join:group', (data) => {
				collection_groups.findOne({ id: data.groupId }).then((doc) => {
					if (doc) {
						collection_groups.update({ id: data.groupId }, { $push: { members: data.userId } }).then(() => {
							// ====================================================== needs emit to group members view!!
							io.to(socket.id).emit('res:join:group', 'ok');
						});
					} else {
						io.to(socket.id).emit('res:join:group', 'notfound');
					}
				});
			});

			// ============================================ △ Group Data △
			//

			//
			// ============================================ ▽ List Data ▽
			const collection_lists = db.get('lists'); // initialize collection

			// get user lists
			socket.on('req:listsData', (userId) => {
				collection_lists.find({ owner: userId }).then((doc) => {
					io.to(socket.id).emit('res:listsData', doc);
				});
			});

			// get user group names
			socket.on('req:listsMyGroups', (userId) => {
				collection_groups.find({ members: userId }, { fields: { id: 1, name: 1 } }).then((docs) => {
					io.to(socket.id).emit('res:listsMyGroups', docs);
				});
			});

			// get user group name
			socket.on('req:listGroupName', ({ groupId }) => {
				collection_groups.findOne({ id: groupId }, { fields: { id: 1, name: 1 } }).then((docs) => {
					io.to(socket.id).emit('res:listGroupName:' + groupId, docs);
				});
			});

			// create list
			socket.on('add:list', (reqData) => {
				collection_lists.insert({ ...reqData }).then(() => {
					console.log('New list! ' + reqData.id + ' - ' + reqData.name);
				});
			});

			// ============================================ △ List Data △
			//

			// disconnect is fired when a client leaves the site
			socket.on('disconnect', () => {
				// console.log('Disconnected ' + socket.id);
			});
		});
		// ============================================ △ MongoDB △
		//

		//
		//
		//
		//
		//
		//
		// ============= ▽ Handles any requests that don't match the ones above ▽
		app.get('*', async (req, res) => {
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
