import { supabase } from './api';

import { Request, Response } from 'express-serve-static-core';

export async function Invite(request: Request, response: Response) {
	try {
		const group = request.body.group;
		const user = request.body.user;

		console.log(`inviting:`, { user: user }, { group: group });

		response.send('ok');
	} catch (error: any) {
		console.error(error.message);
		response.status(500).send(error);
	}
}
