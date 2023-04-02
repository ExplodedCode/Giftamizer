import { supabase } from './api';

import { Request, Response } from 'express-serve-static-core';

export async function Invite(request: Request, response: Response) {
	try {
		const group = request.body.group;
		const users = request.body.users;

		users.forEach(async (user: any) => {
			console.log(`inviting`, user);
		});

		response.send('ok');
	} catch (error: any) {
		console.error(error.message);
		response.status(500).send(error);
	}
}
