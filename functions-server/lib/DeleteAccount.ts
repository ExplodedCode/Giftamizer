import { createClient } from '@supabase/supabase-js';

import { Request, Response } from 'express-serve-static-core';
import { Database } from './database.types';

import { supabase } from './api';

export async function DeleteAccount(request: Request, response: Response) {
	try {
		const user_id = request.body.user_id;
		const accessToken = request.headers.authorization?.split('Bearer ')[1];

		if (accessToken) {
			// validate access token JWT and UID match
			const {
				data: { user },
			} = await supabase.auth.getUser(accessToken);
			if (!user || user.id !== user_id) {
				response.status(401).send('Unauthorized');
				return;
			}

			// delete user
			const { error } = await supabase.auth.admin.deleteUser(user_id);
			if (error) {
				response.status(500).send(`Server error: ${error.message}`);
				return;
			}

			response.send('ok');
			return;
		} else {
			response.status(401).send('Unauthorized');
			return;
		}
	} catch (error: any) {
		console.error(error.message);
		response.status(500).send(error);
	}
}
