import { FirebaseScrypt } from 'firebase-scrypt';
import { Pool } from 'pg';
import { supabase } from './api';

import { Request, Response } from 'express-serve-static-core';

interface User {
	instance_id: string;
	id: string;
	aud: string;
	role: string;
	email: string;
	encrypted_password: string;
	email_confirmed_at: Date;
	invited_at: Date;
	confirmation_token: string;
	confirmation_sent_at: Date;
	recovery_token: string;
	recovery_sent_at: Date;
	email_change_token_new: string;
	email_change: string;
	email_change_sent_at: Date;
	last_sign_in_at: Date;
	raw_app_meta_data: any;
	raw_user_meta_data: any;
	is_super_admin: boolean;
	created_at: Date;
	updated_at: Date;
	phone: any;
	phone_confirmed_at: Date;
	phone_change: string;
	phone_change_token: string;
	phone_change_sent_at: Date;
	confirmed_at: Date;
	email_change_token_current: string;
	email_change_confirm_status: number;
	banned_until: Date;
	reauthentication_token: string;
	reauthentication_sent_at: Date;
	is_sso_user: boolean;
	deleted_at: Date;
}

const scrypt = new FirebaseScrypt({
	memCost: parseInt(process.env.FIREBASE_MEMCOST || '14'),
	rounds: parseInt(process.env.FIREBASE_ROUNDS || '8'),
	saltSeparator: process.env.FIREBASE_SALTSEPARATOR || '',
	signerKey: process.env.FIREBASE_SIGNERKEY || '',
});

// Validate auth request
export async function validateAuth(authRequest: Request, authResponse: Response) {
	try {
		const email = authRequest.body.email;
		const password = authRequest.body.password;

		// If email and password are provided
		if (email && password) {
			console.log(`Validating firebase auth: ${email}`);

			// Connect to Postgres database
			const db = new Pool({
				host: process.env.POSTGRES_HOST,
				port: parseInt(process.env.POSTGRES_PORT || '5432'),
				user: process.env.POSTGRES_USER,
				password: process.env.POSTGRES_PASSWORD,
				database: 'postgres',
			});

			// Query for user with provided email
			const result = await db.query(`SELECT * FROM auth.users WHERE email='${email}'`);
			db.end(); // Close database connection

			// Get user from query result
			const user = (result.rows as User[])?.[0];

			// If user found and password is Firebase hashed
			if (user && user.encrypted_password.includes('~~~')) {
				// Get hash and salt from encrypted password
				const hash = String(user.encrypted_password).split('~~~')[0];
				const salt = String(user.encrypted_password).split('~~~')[1];

				// Verify provided password against hash and salt
				const isValid = await scrypt.verify(password, salt, hash);

				if (isValid) {
					// Update user password in Supabase
					const { error } = await supabase.auth.admin.updateUserById(user.id, { password });
					// If error updating password; Log and send error message
					if (error) {
						console.error(error.message);
						authResponse.status(500).send(error.message);
						return;
					}

					authResponse.send('valid');
				} else {
					authResponse.send('invalid');
				}
			} else {
				// If no user found, send error message
				const msg = `User not found.`;
				console.log(msg);
				authResponse.send(msg);
			}
		} else {
			// If invalid request, send error response
			authResponse.statusCode = 500;
			authResponse.send('Invalid Request');
		}
	} catch (error) {
		// Log and send any errors
		console.error(error);
		authResponse.status(500).send(String(error));
	}
}
