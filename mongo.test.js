const { EditAttributes } = require('@mui/icons-material');
const stringify = require('json-stringify-pretty-compact');

const connection_string = 'mongodb://root:qMhUXkqtFuvt4M6vdL6X@azure.trowbridge.tech:27017/Giftamizer?authSource=admin';

async function start() {
	//
	//
	const { MongoClient } = require('mongodb');
	const client = new MongoClient(connection_string);
	await client.connect();
	const db = client.db('Giftamizer');

	//
	//

	const groupId = '95dda3ca1284';

	var group = await db.collection('groups').findOne({ id: groupId }, { members: 1 });
	db.collection('users')
		.aggregate([{ $match: { uid: { $in: group.members } } }, { $unionWith: { coll: 'lists', pipeline: [{ $match: { $and: [{ groups: groupId }, { isForChild: true }] } }] } }])
		.toArray((err, members) => {
			console.log(members);
		});
}

start();

while (true) {
	Eat();
	Sleep();
	Coffee();
	Code();
}
