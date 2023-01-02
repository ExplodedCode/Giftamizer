import { FirebaseScrypt } from 'firebase-scrypt';
import { Pool } from 'pg';
import { supabase } from './api';

import { Request, Response } from 'express-serve-static-core';

const scrypt = new FirebaseScrypt({
	memCost: parseInt(process.env.FIREBASE_MEMCOST || '14'),
	rounds: parseInt(process.env.FIREBASE_ROUNDS || '8'),
	saltSeparator: process.env.FIREBASE_SALTSEPARATOR || '',
	signerKey: process.env.FIREBASE_SIGNERKEY || '',
});

export async function ValidateAuth(request: Request, response: Response) {
	try {
		const email = request.body.email;
		const password = request.body.password;

		console.log(`Firebase validate auth: ${email}`);

		if (email && password) {
			const pool = new Pool({
				host: process.env.POSTGRES_HOST,
				port: parseInt(process.env.POSTGRES_PORT || '5432'),
				user: process.env.POSTGRES_USER,
				password: process.env.POSTGRES_PASSWORD,
				database: 'postgres',
			});

			pool.query(`SELECT * FROM auth.users WHERE email='${email}'`, (err, res) => {
				if (err) {
					response.statusCode = 500;
					response.send('Database Error');
					console.log(err);
					return;
				}
				pool.end();

				const user = res.rows[0];
				if (user && user.encrypted_password.includes('~~~')) {
					const hash = user.encrypted_password.split('~~~')[0];
					const salt = user.encrypted_password.split('~~~')[1];

					scrypt
						.verify(password, salt, hash)
						.then(async (isValid) => {
							console.log(`Firebase validate auth: ${isValid ? 'valid' : 'invalid'}`, {
								hash: hash,
								salt: salt,
							});

							if (isValid) {
								const { data, error } = await supabase.auth.admin.updateUserById(user.id, { password: password });
								if (error) {
									console.error(error.message);
									response.status(500).send(error);
									return;
								}

								response.send('valid');
							} else {
								response.send('invalid');
							}
						})
						.catch((err) => {
							response.statusCode = 500;
							response.send(JSON.stringify(err));
						});
				} else {
					const msg = `Firebase user not found.`;
					console.log(msg);
					response.send(msg);
				}
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
