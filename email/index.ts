import { getToken, sendEmail } from './graph';

require('dotenv').config();

const emails = [
	'emohlenhoffis@gmail.com',
	'mjmartin921@gmail.com',
	'pastormark@gmail.com',
	'abby.hoback@gmail.com',
	'123jamesfrancis@gmail.com',
	'snikrdoodle2004@yahoo.com',
	'abbymartin618@gmail.com',
	'megha_1922@yahoo.com',
	'nancy@bucherfamily.com',
	'countrygirl7803@gmail.com',
	'abrielle62500@hotmail.com',
	'joshuaphero@gmail.com',
	'reflog18@comcast.net',
	'stephenrmoh@gmail.com',
	'codysbots@gmail.com',
	'amyrcarnall@gmail.com',
	'annell.delrio@gmail.com',
	'srenovales18@hotmail.com',
	'jason.mccolly@protonmail.com',
	'aethorix@gmail.com',
	'merenecessiti@gmail.com',
	'e.botsford57@gmail.com',
	'patriot5713@hotmail.com',
	'cindy.lee.botsford@gmail.com',
	'ecb3023@gmail.com',
	'amohlenhoffis@gmail.com',
	'mmohlenhoffis@gmail.com',
	'templin205@gmail.com',
	'kb12eek@gmail.com',
	'jbotsford16@gmail.com',
	'marlngilm@gmail.com',
	'craigmo99@gmail.com',
	'huntermartin0907@gmail.com',
	'gardenfairie@hotmail.com',
	'bztemplin@gmail.com',
	'emmamadlynrose@gmail.com',
	'stanandkristen@gmail.com',
	'tristanfrederick360@gmail.com',
	'dannyfrederick360@gmail.com',
	'gracelynnt17@gmail.com',
	'tinkerheels@gmail.com',
	'emphyillaier@gmail.com',
	'evan.templin@gmail.com',
	'shrubochak70@gmail.com',
	'ethantrowb@gmail.com',
	'beccashirk12@gmail.com',
	'srobo1992@gmail.com',
	'drobocop@hotmail.com',
	'evantrowbridge1@gmail.com',
];
import html from './email';

(async function () {
	for (const email of emails) {
		const emailContent = {
			from: 'noreply@giftamizer.com',
			fromName: 'giftamizer',
			to: [email],
			subject: 'Say Hello to the New Giftamizer!',
			body: html,
		};

		const token = await getToken();
		// console.log('token:', token);
		const res = await sendEmail(token, emailContent);

		console.log(res.status, email);
	}
})();
