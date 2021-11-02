const path = require('path');
var express = require('express');
const http = require('http');
var cors = require('cors');
var bodyParser = require('body-parser');

const { ObjectID } = require('mongodb');

const port = process.env.PORT || 8080;

const socketIO = require('socket.io');

const { ObjectId } = require('mongodb'); // or ObjectID

//
// var connection_string = 'mongodb://root:qMhUXkqtFuvt4M6vdL6X@4b3b1bdc0795:27017/Giftamizer?authSource=admin';
//var connection_string = 'mongodb://root:qMhUXkqtFuvt4M6vdL6X@azure.trowbridge.tech:27017/Giftamizer?authSource=admin';

// add "ENV IS_DOCKER_CONTAINER yes" to docker file
var isDockerContainer = process.env.IS_DOCKER_CONTAINER || 'no';
if (isDockerContainer === 'yes') {
	var connection_string = 'mongodb://root:qMhUXkqtFuvt4M6vdL6X@172.20.68.50:27017/Giftamizer?authSource=admin';
} else {
	var connection_string = 'mongodb://root:qMhUXkqtFuvt4M6vdL6X@trowbridge.tech:27017/Giftamizer?authSource=admin';
}

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
	const { MongoClient } = require('mongodb');
	const client = new MongoClient(connection_string);
	await client.connect();
	const db = client.db('Giftamizer');

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
			// ============================================ ▽ System Data ▽
			const collection_system = db.collection('system'); // initialize collection

			// get maintenance status
			socket.on('req:maintenance', () => {
				try {
					collection_system.findOne({ cd: 'maintenance' }, function (err, result) {
						if (err) throw err;
						io.to(socket.id).emit('res:maintenance', result);
					});
				} catch (error) {
					console.log(error);
				}
			});

			// get maintenance status admin
			socket.on('req:maintenanceAdmin', () => {
				try {
					collection_system.findOne({ cd: 'maintenance' }, function (err, result) {
						if (err) throw err;
						io.to(socket.id).emit('res:maintenanceAdmin', result);
					});
				} catch (error) {
					console.log(error);
				}
			});

			// set maintenance status
			socket.on('set:maintenance', (status) => {
				try {
					collection_system.update({ cd: 'maintenance' }, { $set: { cd: 'maintenance', status: status } }).then(() => {
						collection_system.findOne({ cd: 'maintenance' }).then((doc) => {
							io.emit('res:maintenance', doc);
						});
					});
				} catch (error) {
					console.log(error);
				}
			});

			// ============================================ △ System Data △
			//

			//
			// ============================================ ▽ User Data ▽
			const collection_users = db.collection('users'); // initialize collection

			// get user data
			socket.on('req:userData', (userId) => {
				try {
					collection_users
						.aggregate([
							{ $match: { uid: userId } },
							{
								$lookup: {
									from: 'groups',
									localField: 'starred',
									foreignField: 'id',
									as: 'starredGroups',
								},
							},
						])
						.toArray((err, userdata) => {
							io.to(socket.id).emit('res:userData', userdata[0]);
						});

					// collection_users.findOne({ uid: userId }).then((doc) => {
					// 	io.to(socket.id).emit('res:userData', doc);
					// });
				} catch (error) {
					console.log(error);
				}
			});

			// add user data
			socket.on('add:userData', (reqData) => {
				try {
					collection_users.insertOne({ ...reqData }).then(() => {
						// console.log('New User! ' + reqData.uid + ' - ' + reqData.displayName + ' - ' + reqData.email);
					});
				} catch (error) {
					console.log(error);
				}
			});

			// set user data
			socket.on('set:userData', (userData) => {
				try {
					collection_users.update({ uid: userData.uid }, { $set: { ...userData.display } }).then(() => {
						// console.log('user updated User! ' + userData.uid);
					});
				} catch (error) {
					console.log(error);
				}
			});

			// ============================================ △ User Data △
			//

			//
			// ============================================ ▽ Group Data ▽
			const collection_groups = db.collection('groups'); // initialize collection

			// get user groups
			socket.on('req:groupsData', (userId) => {
				try {
					collection_groups.find({ members: userId }).toArray(function (err, groups) {
						if (err) throw err;

						collection_users
							.aggregate([
								{ $match: { uid: userId } },
								{
									$lookup: {
										from: 'groups',
										localField: 'starred',
										foreignField: 'id',
										as: 'starredGroups',
									},
								},
							])
							.toArray((err2, userdata) => {
								if (err2) throw err;

								io.to(socket.id).emit('res:groupsData', { groups: groups, user: userdata[0] });
							});
					});
				} catch (error) {
					console.log(error);
				}
			});

			// create group
			socket.on('add:group', (reqData) => {
				try {
					collection_groups.insertOne({ ...reqData }).then(() => {
						// console.log('New Group! ' + reqData.id + ' - ' + reqData.name);
					});
				} catch (error) {
					console.log(error);
				}
			});

			// set group
			socket.on('set:group', (data) => {
				try {
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
				} catch (error) {
					console.log(error);
				}
			});

			// remove member
			socket.on('del:member', (data) => {
				try {
					collection_groups.findOne({ id: data.groupId }).then((doc) => {
						if (doc && doc.owner === data.user) {
							collection_groups.update({ id: data.groupId }, { $pull: { members: data.userId } }).then(() => {
								// ====================================================== needs emit to group members view!!
								io.to(socket.id).emit('res:del:member', 'ok');
							});
						} else {
							io.to(socket.id).emit('res:del:member', 'notfound');
						}
					});
				} catch (error) {
					console.log(error);
				}
			});

			// join group
			socket.on('join:group', (data) => {
				try {
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
				} catch (error) {
					console.log(error);
				}
			});

			// get members
			socket.on('req:groupMembers', async ({ groupId, userId }) => {
				try {
					var group = await collection_groups.findOne({ id: groupId }, { members: 1 });
					collection_users
						.aggregate([
							{ $match: { $and: [{ uid: { $in: group.members } }, { uid: { $ne: userId } }] } },
							{ $unionWith: { coll: 'lists', pipeline: [{ $match: { $and: [{ groups: groupId }, { isForChild: true }] } }] } },
						])
						.toArray((err, members) => {
							if (err) {
								console.log(err);
								io.to(socket.id).emit('res:groupMembers', 'error');
							} else {
								io.to(socket.id).emit('res:groupMembers', members);
							}
						});
				} catch (error) {
					console.log(error);
				}
			});

			// delete group
			socket.on('req:deleteGroup', ({ groupId, userId }) => {
				try {
					collection_groups.findOne({ _id: ObjectId(groupId) }).then((doc) => {
						if (doc && doc.owner === userId) {
							collection_groups.deleteOne({ owner: userId, _id: ObjectId(groupId) }).then((docs) => {
								io.to(socket.id).emit('res:deleteGroup', 'ok');
							});
						} else {
							io.to(socket.id).emit('res:deleteGroup', 'notfound');
						}
					});
				} catch (error) {
					console.log(error);
				}
			});

			//  star group
			socket.on('star:group', (data) => {
				try {
					collection_users.findOne({ uid: data.userId }).then((user) => {
						if (user.starred) {
							if (user.starred.includes(data.groupId)) {
								collection_users.update({ uid: data.userId }, { $pull: { starred: data.groupId } }).then(() => {
									io.to(socket.id).emit('res:star:group', 'ok');
								});
							} else {
								collection_users.update({ uid: data.userId }, { $push: { starred: data.groupId } }).then(() => {
									io.to(socket.id).emit('res:star:group', 'ok');
								});
							}
						} else {
							collection_users.update({ uid: data.userId }, { $push: { starred: data.groupId } }).then(() => {
								io.to(socket.id).emit('res:star:group', 'ok');
							});
						}
					});
				} catch (error) {
					console.log(error);
				}
			});

			// ============================================ △ Group Data △
			//

			//
			// ============================================ ▽ List Data ▽
			const collection_lists = db.collection('lists'); // initialize collection

			// get my lists
			socket.on('req:listsData', (userId) => {
				try {
					collection_lists.find({ owner: userId }).toArray(function (err, result) {
						if (err) throw err;
						io.to(socket.id).emit('res:listsData', result);
					});
				} catch (error) {
					console.log(error);
				}
			});

			// get user list
			socket.on('req:listData', (listId) => {
				try {
					collection_lists.findOne({ _id: ObjectId(listId) }).then((doc) => {
						console.log(doc);

						io.to(socket.id).emit('res:listData', doc);
					});
				} catch (error) {
					console.log(error);
				}
			});

			// get user group names
			socket.on('req:listsMyGroups', (userId) => {
				try {
					collection_groups.find({ members: userId }, { fields: { id: 1, name: 1 } }).toArray(function (err, result) {
						if (err) throw err;
						io.to(socket.id).emit('res:listsMyGroups', result);
					});
				} catch (error) {
					console.log(error);
				}
			});

			// get user group name
			socket.on('req:listGroupName', ({ groupId }) => {
				try {
					collection_groups.findOne({ id: groupId }, { fields: { id: 1, name: 1 } }).then((docs) => {
						io.to(socket.id).emit('res:listGroupName:' + groupId, docs);
					});
				} catch (error) {
					console.log(error);
				}
			});

			// create list
			socket.on('add:list', (reqData) => {
				try {
					collection_lists.insertOne({ ...reqData }).then(() => {
						// console.log('New list! ' + reqData.id + ' - ' + reqData.name);
					});
				} catch (error) {
					console.log(error);
				}
			});

			// set list
			socket.on('set:list', (data) => {
				try {
					collection_lists.findOne({ _id: ObjectId(data._id) }).then((doc) => {
						if (doc && doc.owner === data.editor) {
							delete data.editor;
							var id = data._id;
							delete data._id;
							collection_lists.update({ _id: ObjectId(id) }, { $set: { ...data } }).then(() => {
								// ====================================================== needs emit to group members view!!
								io.to(socket.id).emit('res:set:list', 'ok');
								io.to('liveitems:' + doc.owner).emit('res:updateLiveItems', null);
							});
						} else {
							io.to(socket.id).emit('res:set:list', 'notfound');
						}
					});
				} catch (error) {
					console.log(error);
				}
			});

			// delete list
			socket.on('req:deleteList', ({ listId, userId }) => {
				try {
					collection_lists.findOne({ _id: ObjectId(listId) }).then((doc) => {
						if (doc && doc.owner === userId) {
							collection_lists.deleteOne({ owner: userId, _id: ObjectId(listId) }).then((docs) => {
								io.to(socket.id).emit('res:deleteList', 'ok');
							});
						} else {
							io.to(socket.id).emit('res:deleteList', 'notfound');
							io.to('liveitems:' + doc.owner).emit('res:updateLiveItems', null);
						}
					});
				} catch (error) {
					console.log(error);
				}
			});

			// ============================================ △ List Data △
			//

			//
			// ============================================ ▽ Item Data ▽
			const collection_items = db.collection('items'); // initialize collection

			// get user items
			socket.on('req:itemsData', (userId) => {
				try {
					collection_items.find({ owner: userId }).toArray(function (err, result) {
						if (err) throw err;
						io.to(socket.id).emit('res:itemsData', result);
					});
				} catch (error) {
					console.log(error);
				}
			});

			// create user items
			socket.on('add:item', (reqData) => {
				try {
					collection_items.insertOne({ ...reqData }).then(() => {
						// console.log('New item! ' + reqData.id + ' - ' + reqData.name);
						io.to('liveitems:' + reqData.owner).emit('res:updateLiveItems', null);
					});
				} catch (error) {
					console.log(error);
				}
			});

			// get list name
			socket.on('req:listName', ({ listId }) => {
				try {
					collection_lists.findOne({ _id: ObjectId(listId) }, { fields: { id: 1, name: 1 } }).then((doc) => {
						io.to(socket.id).emit('res:listName:' + listId, doc);
					});
				} catch (error) {
					console.log(error);
				}
			});

			// set item
			socket.on('set:item', (data) => {
				try {
					collection_items.findOne({ _id: ObjectId(data._id) }).then((doc) => {
						// console.log(doc, data);
						if (doc && doc.owner === data.editor) {
							delete data.editor;
							var id = data._id;
							delete data._id;
							collection_items.update({ _id: ObjectId(id) }, { $set: { ...data } }).then(() => {
								// ====================================================== needs emit to group members view!!
								io.to(socket.id).emit('res:set:item', 'ok');

								// console.log('liveitems:' + doc.owner);

								io.to('liveitems:' + doc.owner).emit('res:updateLiveItems', null);
								doc.lists.forEach((list) => {
									io.to('livelist:' + list).emit('res:updateLiveList', null);
								});
							});
						} else {
							io.to(socket.id).emit('res:set:item', 'notfound');
						}
					});
				} catch (error) {
					console.log(error);
				}
			});

			// get users items by group
			socket.on('req:userItemsData', (data) => {
				try {
					collection_lists.find({ owner: data.userId, groups: data.groupId }).toArray((err, lists) => {
						if (err) {
							console.log(err);
							io.to(socket.id).emit('res:userItemsData', 'error');
						} else {
							var listIds = [];
							lists.forEach((list) => {
								if (!list.isForChild) {
									listIds.push(String(list._id));
								}
							});
							collection_items.find({ owner: data.userId, lists: { $in: listIds } }).toArray((err, items) => {
								io.to(socket.id).emit('res:userItemsData', items);
							});
						}
					});
				} catch (error) {
					console.log(error);
				}
			});

			// get list items
			socket.on('req:listItemsData', ({ userId, listId }) => {
				try {
					collection_items.find({ owner: userId, lists: listId }).toArray(function (err, result) {
						if (err) throw err;
						io.to(socket.id).emit('res:listItemsData', result);
					});
				} catch (error) {
					console.log(error);
				}
			});

			// delete items
			socket.on('req:deleteItem', ({ itemId, userId }) => {
				try {
					collection_items.findOne({ _id: ObjectId(itemId) }).then((doc) => {
						if (doc && doc.owner === userId) {
							collection_items.deleteOne({ owner: userId, _id: ObjectId(itemId) }).then((docs) => {
								io.to(socket.id).emit('res:deleteItem', 'ok');
								io.to('liveitems:' + doc.owner).emit('res:updateLiveItems', null);
							});
						} else {
							io.to(socket.id).emit('res:deleteItem', 'notfound');
						}
					});
				} catch (error) {
					console.log(error);
				}
			});

			// set status items
			socket.on('set:itemStatus', ({ itemId, status, takenBy }) => {
				try {
					try {
						collection_items.update({ _id: ObjectID(itemId) }, { $set: { status: status, takenBy: takenBy } }).then((docs) => {
							io.to(socket.id).emit('res:itemStatus', 'ok');
						});
					} catch (error) {
						console.log(error);
					}
				} catch (error) {
					console.log(error);
				}
			});

			// get list items from group view
			socket.on('req:getListItemsFromGroup', ({ listId }) => {
				try {
					collection_items.find({ lists: listId }).toArray((err, docs) => {
						if (err) {
							console.log(err);
							io.to(socket.id).emit('res:getListItemsFromGroup', 'error');
						} else {
							io.to(socket.id).emit('res:getListItemsFromGroup', docs);
						}
					});
				} catch (error) {
					console.log(error);
				}
			});

			// get my shopping list
			socket.on('req:getShoppingList', ({ userId }) => {
				try {
					collection_items
						.aggregate([
							{ $match: { takenBy: userId, status: { $in: ['planned', 'unavailable'] } } },
							{
								$lookup: {
									from: 'users',
									localField: 'owner',
									foreignField: 'uid',
									as: 'user',
								},
							},
							{ $unwind: '$user' },
						])
						.toArray((err, items) => {
							if (err) {
								console.log(err);
								io.to(socket.id).emit('res:getShoppingList', 'error');
							} else {
								io.to(socket.id).emit('res:getShoppingList', items);
							}

							io.to(socket.id).emit('res:getShoppingList', items);
						});

					// collection_items.find({ takenBy: userId, status: { $in: ['planned', 'unavailable'] } }).toArray((err, items) => {
					// 	if (err) {
					// 		console.log(err);
					// 		io.to(socket.id).emit('res:getShoppingList', 'error');
					// 	} else {
					// 		io.to(socket.id).emit('res:getShoppingList', items);
					// 	}

					// 	io.to(socket.id).emit('res:getShoppingList', items);
					// });
				} catch (error) {
					console.log(error);
				}
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
