import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import * as Firebase from './lib/Firebase';

import * as SocialAvatar from './lib/SocialAvatar';

import * as Invite from './lib/Invite';

import { DeleteAccount } from './lib/DeleteAccount';

import { URLMetadata } from './lib/URLMetadata';

require('dotenv').config();

const api = express();
api.use(
	cors({
		origin: '*',
		optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
	})
);

// Body Parser Middleware
api.use(bodyParser.json());

(async function () {
	const server = api.listen(process.env.PORT || 8080, function () {
		// @ts-ignore
		var port = server.address().port;
		console.log('App now running on port', port);
	});

	// api.post('/firebase-auth', Firebase.validateAuth);

	// api.post('/socialavatar/download', SocialAvatar.Download);

	// api.post('/invite/internal', Invite.Internal);
	// api.post('/invite/external', Invite.External);

	api.post('/user/delete', DeleteAccount);

	// api.post('/url-metadata', URLMetadata);

	// api.post('/hello', (req, res) => {
	// 	console.log(req.body);
	// 	res.send({ data: req.body });
	// });

	// const { data, error } = await supabase.from('profiles').select('*').limit(1);

	// console.log(data, error);
})();
