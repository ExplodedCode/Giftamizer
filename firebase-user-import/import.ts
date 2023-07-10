import moment from 'moment';
import { Pool } from 'pg';

require('dotenv').config();

const users = require('./users.json');

let rows: any[] = [];

(async function () {
	users.forEach((user: any) => {
		rows.push(createUser(user));
	});

	let sql = createUserHeader() + rows.join(',\n') + 'ON CONFLICT DO NOTHING;';

	// fs.writeFile('import.sql', sql, () => {});

	const pool = new Pool({
		host: process.env.POSTGRES_HOST,
		port: parseInt(process.env.POSTGRES_PORT || '5432'),
		user: process.env.POSTGRES_USER,
		password: process.env.POSTGRES_PASSWORD,
		database: 'postgres',
	});

	pool.query(sql, (err, res) => {
		if (err) {
			console.log(err);
			return;
		} else {
			console.log(`Imported ${rows.length} users`);
		}
	});
	pool.end();
})();

function createUserHeader() {
	return `INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        email_change_token_current,
        email_change_confirm_status) VALUES `;
}

function createUser(user: any) {
	var user_metadata = user.metadata;

	var splits = user_metadata.name.split(' ');
	user_metadata.first_name = splits[0];
	user_metadata.last_name = splits[splits.length - 1];

	var sql = `(
        '00000000-0000-0000-0000-000000000000', /* instance_id */
        uuid_generate_v4(), /* id */
        'authenticated', /* aud character varying(255),*/
        'authenticated', /* role character varying(255),*/
        '${user.email}', /* email character varying(255),*/
        '${user.auth}', /* encrypted_password character varying(255),*/
        NOW(), /* email_confirmed_at timestamp with time zone,*/
        '${moment(user.dates.creationTime, 'YYYY/MM/DD HH:mm:ss').format('YYYY-MM-DDTHH:mm:ss')}.000Z', /* invited_at timestamp with time zone, */
        '', /* confirmation_token character varying(255), */
        null, /* confirmation_sent_at timestamp with time zone, */
        '', /* recovery_token character varying(255), */
        null, /* recovery_sent_at timestamp with time zone, */
        '', /* email_change_token_new character varying(255), */
        '', /* email_change character varying(255), */
        null, /* email_change_sent_at timestamp with time zone, */
        '${moment(user.dates.lastSignInTime, 'YYYY/MM/DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')}.000001+00', /* last_sign_in_at timestamp with time zone, */
        '{"provider":"email","providers":["email"]}', /* raw_app_meta_data jsonb,*/
        '${JSON.stringify(user_metadata)}', /* raw_user_meta_data jsonb,*/
        false, /* is_super_admin boolean, */
        '${moment(user.dates.creationTime, 'YYYY/MM/DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')}.000001+00', /* created_at timestamp with time zone, */
        NOW(), /* updated_at timestamp with time zone, */
        null, /* phone character varying(15) DEFAULT NULL::character varying, */
        null, /* phone_confirmed_at timestamp with time zone, */
        '', /* phone_change character varying(15) DEFAULT ''::character varying, */
        '', /* phone_change_token character varying(255) DEFAULT ''::character varying, */
        null, /* phone_change_sent_at timestamp with time zone, */
        '', /* email_change_token_current character varying(255) DEFAULT ''::character varying, */
        0 /*email_change_confirm_status smallint DEFAULT 0 */
        )`;

	return sql;
}
