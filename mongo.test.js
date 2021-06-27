const { EditAttributes } = require('@material-ui/icons');
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

	db.collection('users')
		.aggregate([
			{ $match: { uid: 'jwpIwFNoPKh2YwRCbTkAJZypXyx2' } },
			{
				$lookup: {
					from: 'groups',
					localField: 'starred',
					foreignField: 'id',
					as: 'friendsData',
				},
			},
		])
		.toArray((err, members) => {
			console.log(members[0]);
		});
}

start();
