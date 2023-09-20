import { getToken, sendEmail } from './graph';

require('dotenv').config();

const users = require('./users.json');
import html from './email';

(async function () {
	// users.forEach((user: any) => {
	// 	console.log(user.email);

	// });

	const email = {
		from: 'noreply@giftamizer.com',
		fromName: 'giftamizer',
		to: ['evan@trowbridge.tech', 'evan.templin@gmail.com'],
		subject: 'Say Hello to the New Giftamizer!',
		body: html,
	};

	const token = await getToken();
	console.log('token:', token);
	const res = await sendEmail(token, email);

	console.log(res);
})();
