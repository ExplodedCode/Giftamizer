import axios from 'axios';
import { supabase } from './api';

import { Request, Response } from 'express-serve-static-core';

export async function Download(request: Request, response: Response) {
	try {
		const user_id = request.body.user_id;
		const url = request.body.url;

		console.log(`Download avatar for ${user_id}: ${url}`);

		if (url && user_id) {
			await axios({
				url,
				method: 'GET',
				responseType: 'arraybuffer',
			})
				.then(async (res) => {
					const { error } = await supabase.storage.from('avatars').upload(`${user_id}`, Buffer.from(res.data, 'binary').buffer, {
						cacheControl: '3600',
						upsert: true,
						contentType: 'image/jpeg',
					});
					if (error) {
						console.error(error.message);
						response.status(500).send(error);
					} else {
						await supabase.from('profiles').update({ avatar_token: Date.now() }).eq('user_id', user_id);

						response.send('ok');
					}
				})
				.catch((error) => {
					console.error(error.message);
					response.status(500).send(error);
				});
		} else {
			response.statusCode = 500;
			response.send('Invalid Request');
		}
	} catch (error: any) {
		console.error(error.message);
		response.status(500).send(error);
	}
}
