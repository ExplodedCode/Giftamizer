require('dotenv').config();

import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

(async function () {
	const supabase = createClient<Database>(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '', {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});

	// delete all users
	const { data, error } = await supabase.auth.admin.listUsers();
	data.users.forEach(async (user) => {
		console.log(user.id);
		await supabase.auth.admin.deleteUser(user.id);
	});

	console.log(data, error);
})();
