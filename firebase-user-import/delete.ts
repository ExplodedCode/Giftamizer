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
	const { data, error } = await supabase.from('profiles').select('*');
	data?.forEach(async (user) => {
		console.log(user.user_id);
		await supabase.auth.admin.deleteUser(user.user_id);
	});

	await supabase.from('items').delete().not('user_id', 'is', null);
	await supabase.from('groups').delete().not('name', 'is', null);
	await supabase.from('group_members').delete().not('user_id', 'is', null);
	await supabase.from('lists').delete().not('user_id', 'is', null);

	console.log(data, error);
})();
