const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');
const moment = require('moment');

const profiles = require('./profiles.json');

start();

async function start() {
	const { stdout, stderr } = await exec('firebase auth:export users.json --format=json --project gift-group');

	let users = JSON.parse(fs.readFileSync('./users.json')).users;

	users = users.map((user) => {
		let profile = profiles.find((p) => p.uid === user.localId);

		return {
			uid: user.localId,
			email: user.email,
			emailVerified: true,
			disabled: false,
			dates: {
				lastSignInTime: moment(parseInt(user.lastSignedInAt)).format('YYYY/MM/DD HH:MM:ss'),
				creationTime: moment(parseInt(user.createdAt)).format('YYYY/MM/DD HH:MM:ss'),
			},
			auth: `${user.passwordHash}~~~${user.salt}`,
			metadata: {
				name: profile?.displayName ?? '',
				email: user.email,
				providerId: 'password',
				firebase_uid: user.localId,
			},
			providerData: [{ uid: user.localId, email: user.email, providerId: 'password' }],
		};
	});

	fs.writeFileSync('./users.json', JSON.stringify(users, null, 4));

	if (stdout) console.log('stdout:', stdout);
	if (stderr) console.log('stdout:', stderr);
}
