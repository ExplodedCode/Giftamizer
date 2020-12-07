const path = require('path');
var express = require('express');
const http = require('http');
var cors = require('cors');
var bodyParser = require('body-parser');

const port = process.env.PORT || 8080;

const socketIO = require('socket.io');
var connection_string = 'mongodb://root:qMhUXkqtFuvt4M6vdL6X@azure.trowbridge.tech:27017/Giftamizer?authSource=admin';

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

		// Invite email
		var Emailer = require('./controllers/Email')(null, null);
		app.get('/api/sendInvite', Emailer.sendInvite);

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
						if (doc.members.includes(data.userId)) {
							io.to(socket.id).emit('res:join:group', 'alreadyjoined');
						} else {
							collection_groups.update({ id: data.groupId }, { $push: { members: data.userId } }).then(() => {
								// ====================================================== needs emit to group members view!!
								io.to(socket.id).emit('res:join:group', 'ok');
							});
						}
					} else {
						io.to(socket.id).emit('res:join:group', 'notfound');
					}
				});
			});

			// get members
			socket.on('req:groupMembers', ({ groupId, userId }) => {
				collection_groups.findOne({ id: groupId }).then((group) => {
					collection_users.find({ $and: [{ uid: { $in: group.members } }, { uid: { ne: userId } }] }).then((members) => {
						io.to(socket.id).emit('res:groupMembers', members);
					});
					// if (membersOutput.length === group.members.length) {
					// 	console.log(membersOutput);
					// 	io.to(socket.id).emit('res:groupMembers', membersOutput);
					// }
				});
			});

			// get non-user lists in group
			socket.on('req:nonUserLists', ({ groupId }) => {
				console.log(groupId);
				collection_lists.find({ groups: groupId, isForChild: true }).then((members) => {
					io.to(socket.id).emit('res:nonUserLists', members);
				});
			});

			// ============================================ △ Group Data △
			//

			//
			// ============================================ ▽ List Data ▽
			const collection_lists = db.get('lists'); // initialize collection

			// get user lists
			socket.on('req:listsData', (userId) => {
				collection_lists.find({ owner: userId }).then((docs) => {
					io.to(socket.id).emit('res:listsData', docs);
				});
			});

			// get user list
			socket.on('req:listData', (listId) => {
				collection_lists.findOne({ _id: listId }).then((doc) => {
					io.to(socket.id).emit('res:listData', doc);
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

			// set list
			socket.on('set:list', (data) => {
				collection_lists.findOne({ _id: data._id }).then((doc) => {
					if (doc && doc.owner === data.editor) {
						delete data.owner;
						collection_lists.update({ _id: data._id }, { $set: { ...data } }).then(() => {
							// ====================================================== needs emit to group members view!!
							io.to(socket.id).emit('res:set:list', 'ok');
						});
					} else {
						io.to(socket.id).emit('res:set:list', 'notfound');
					}
				});
			});

			// delete list
			socket.on('req:deleteList', ({ listId, userId }) => {
				collection_lists.findOne({ _id: listId }).then((doc) => {
					if (doc && doc.owner === userId) {
						collection_lists.remove({ owner: userId, _id: listId }).then((docs) => {
							io.to(socket.id).emit('res:deleteList', 'ok');
						});
					} else {
						io.to(socket.id).emit('res:deleteList', 'notfound');
					}
				});
			});

			// ============================================ △ List Data △
			//

			//
			// ============================================ ▽ Item Data ▽
			const collection_items = db.get('items'); // initialize collection

			// get user items
			socket.on('req:itemsData', (userId) => {
				collection_items.find({ owner: userId }).then((docs) => {
					io.to(socket.id).emit('res:itemsData', docs);
				});
			});

			// create user items
			socket.on('add:item', (reqData) => {
				collection_items.insert({ ...reqData }).then(() => {
					console.log('New list! ' + reqData.id + ' - ' + reqData.name);
				});
			});

			// get list name
			socket.on('req:listName', ({ listId }) => {
				collection_lists.findOne({ _id: listId }, { fields: { id: 1, name: 1 } }).then((doc) => {
					io.to(socket.id).emit('res:listName:' + listId, doc);
				});
			});

			// set item
			socket.on('set:item', (data) => {
				collection_items.findOne({ _id: data._id }).then((doc) => {
					console.log(doc, data);
					if (doc && doc.owner === data.editor) {
						delete data.owner;
						collection_items.update({ _id: data._id }, { $set: { ...data } }).then(() => {
							// ====================================================== needs emit to group members view!!
							io.to(socket.id).emit('res:set:item', 'ok');
						});
					} else {
						io.to(socket.id).emit('res:set:item', 'notfound');
					}
				});
			});

			// get list items
			socket.on('req:listItemsData', ({ userId, listId }) => {
				collection_items.find({ owner: userId, lists: listId }).then((docs) => {
					io.to(socket.id).emit('res:listItemsData', docs);
				});
			});

			// delete items
			socket.on('req:deleteItem', ({ itemId, userId }) => {
				collection_items.findOne({ _id: itemId }).then((doc) => {
					if (doc && doc.owner === userId) {
						collection_items.remove({ owner: userId, _id: itemId }).then((docs) => {
							io.to(socket.id).emit('res:deleteItem', 'ok');
						});
					} else {
						io.to(socket.id).emit('res:deleteItem', 'notfound');
					}
				});
			});

			// set status items
			socket.on('set:itemStatus', ({ itemId, status, takenBy }) => {
				collection_items.findOne({ _id: itemId }).then((doc) => {
					if (doc) {
						doc.status = status;
						doc.takenBy = takenBy;

						collection_items.update({ _id: itemId }, { $set: { ...doc } }).then((docs) => {
							io.to(socket.id).emit('res:itemStatus', 'ok');
						});

						doc.lists.forEach((list) => {
							io.to('livelist:' + list).emit('res:updateLiveList', 'update');
						});
					} else {
						io.to(socket.id).emit('res:itemStatus', 'notfound');
					}
				});
			});

			// get list items from group view
			socket.on('req:getListItemsFromGroup', ({ listId }) => {
				collection_items.find({ lists: listId }).then((docs) => {
					io.to(socket.id).emit('res:getListItemsFromGroup', docs);
				});
			});

			// ============================================ △ Item Data △
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
