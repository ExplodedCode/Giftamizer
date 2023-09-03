import moment from 'moment';
import { Pool } from 'pg';

require('dotenv').config();

// Generate Firebase Export
// https://firebase.google.com/docs/cli/auth#authexport
const users = require('./users.json');
const groups = require('./groups.json');
const lists = require('./lists.json');
const items = require('./items.json');

let userRows: any[] = [];
let groupRows: any[] = [];
let groupImages: any[] = [];
let groupMembers: any[] = [];
let listRows: any[] = [];
let itemRows: any[] = [];

interface IArrayDictionary {
	[index: string]: any[];
}

interface IStringDictionary {
	[index: string]: string;
}

(async function () {
	// Setup Supabase Connection
	const pool = new Pool({
		host: process.env.POSTGRES_HOST,
		port: parseInt(process.env.POSTGRES_PORT || '5432'),
		user: process.env.POSTGRES_USER,
		password: process.env.POSTGRES_PASSWORD,
		database: 'postgres',
	});

	let testing = true;

	if (!testing) {
		// Get Firebase Users
		users.forEach((user: any) => {
			userRows.push(createUser(user));
		});

		// Create SQL object for new Supabase Users
		let userSql = createUserHeader() + userRows.join(',\n') + 'ON CONFLICT DO NOTHING RETURNING *;';

		// Save copy of SQL script
		// fs.writeFile('import.sql', sql, () => {});

		// Execute New User SQL creation script
		pool.query(userSql, (err, res) => {
			if (err) {
				console.log(err);
				return;
			} else {
				console.log(`Imported ${userRows.length} users`);
			}
		});

		// Import New Supabase ID with Mongo ID into temp table
	}

	// Get Groups from Mongo
	groups.forEach((group: any) => {
		// Import Group into Supabase
		groupRows.push(createGroup(group));

		// Get Group Images to import into Supabase
		groupImages.push(getGroupImage(group));

		// Get Group Members
		groupMembers.push(getGroupMembers(group));
	});

	// Execute Group Creation SQL
	let groupSql = createGroupHeader() + groupRows.join(',\n') + 'ON CONFLICT DO NOTHING RETURNING *;';
	let groupRes = null;
	console.log(groupSql);
	pool.query(groupSql, (err, res) => {
		if (err) {
			console.log(err);
			return;
		} else {
			console.log(`Imported ${groupRows.length} groups`);
			console.log(res);
			console.log(res.rows);
			groupRes = res;
		}
	});

	// Import New Supabase ID with Mongo ID into temp table
	if (!testing) {
		// Import Group Members into group_members & set owner
		groupMembers.forEach((groupMember: any) => {
			// Import Group Members
			let groupMemberSql = createGroupMemberHeader() + createGroupMember(groupMember) + 'ON CONFLICT DO NOTHING RETURNING *;';

			pool.query(groupMemberSql, (err, res) => {
				if (err) {
					console.log(err);
					return;
				} else {
					console.log(`Imported ${groupMemberSql.length} group members`);
				}
			});
		});

		// Import Group Images
		groupImages.forEach((groupImage: any) => {
			if (groupImage.value !== '') {
				// Import
			}
		});
	}

	if (!testing) {
		// Get Lists from Mongo
		lists.forEach((list: any) => {
			listRows.push(createList(list));
		});
		// Import Lists into Supabase
		// Import New Supabase ID with Mongo ID into temp table
		// Import Lists into lists_groups

		// Get Items from Mongo
		items.forEach((item: any) => {
			itemRows.push(createItem(item));
		});
		// Import Items into Supabase
		// Clean URLs for items on import (ExtractURLFromTest and StandardizeURL)
		// Import New Supabase ID with Mongo ID into temp table
		// Import List into items_lists
	}

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

function createGroupHeader() {
	return `INSERT INTO public.groups (
        name,
        image_token) VALUES `;
}

function createGroupMemberHeader() {
	return `INSERT INTO public.group_members (
                group_id, 
		user_id, 
		owner, 
		invite, 
		pinned) VALUES `;
}

function createUser(user: any) {
	let user_metadata = user.metadata;

	let splits = user_metadata.name.split(' ');
	user_metadata.first_name = splits[0];
	user_metadata.last_name = splits[splits.length - 1];

	let sql = `(
        '00000000-0000-0000-0000-000000000000', /* instance_id */
        uuid_generate_v4(), /* id */
        'authenticated', /* aud character letying(255),*/
        'authenticated', /* role character letying(255),*/
        '${user.email}', /* email character letying(255),*/
        '${user.auth}', /* encrypted_password character letying(255),*/
        NOW(), /* email_confirmed_at timestamp with time zone,*/
        '${moment(user.dates.creationTime, 'YYYY/MM/DD HH:mm:ss').format('YYYY-MM-DDTHH:mm:ss')}.000Z', /* invited_at timestamp with time zone, */
        '', /* confirmation_token character letying(255), */
        null, /* confirmation_sent_at timestamp with time zone, */
        '', /* recovery_token character letying(255), */
        null, /* recovery_sent_at timestamp with time zone, */
        '', /* email_change_token_new character letying(255), */
        '', /* email_change character letying(255), */
        null, /* email_change_sent_at timestamp with time zone, */
        '${moment(user.dates.lastSignInTime, 'YYYY/MM/DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')}.000001+00', /* last_sign_in_at timestamp with time zone, */
        '{"provider":"email","providers":["email"]}', /* raw_app_meta_data jsonb,*/
        '${JSON.stringify(user_metadata)}', /* raw_user_meta_data jsonb,*/
        false, /* is_super_admin boolean, */
        '${moment(user.dates.creationTime, 'YYYY/MM/DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')}.000001+00', /* created_at timestamp with time zone, */
        NOW(), /* updated_at timestamp with time zone, */
        null, /* phone character letying(15) DEFAULT NULL::character letying, */
        null, /* phone_confirmed_at timestamp with time zone, */
        '', /* phone_change character letying(15) DEFAULT ''::character letying, */
        '', /* phone_change_token character letying(255) DEFAULT ''::character letying, */
        null, /* phone_change_sent_at timestamp with time zone, */
        '', /* email_change_token_current character letying(255) DEFAULT ''::character letying, */
        0 /*email_change_confirm_status smallint DEFAULT 0 */
        )`;

	return sql;
}

function getGroupImage(group: any): any {
	let groupImageDict = {} as IStringDictionary;
	let mongoID = group.id;
	let groupImage = '';
	if (group.backgroundType == 'Image') {
		groupImage = group.backgroundValue;
	}

	groupImageDict[mongoID] = groupImage;

	return groupImage;
}

function getGroupMembers(group: any): any {
	let groupMembersDict = {} as IArrayDictionary;
	let mongoID = group.id;
	let groupMembers = group.members;

	groupMembersDict[mongoID] = groupMembers;

	return groupMembers;
}

function createGroup(group: any): any {
	//let mongoID = group.id;
	//let groupMembers = group.members;
	//let groupOwner = group.owner;
	let groupName = group.name;

	let sql = `('${groupName.replaceAll(`'`, `''`)}-import', ${moment().unix()})`;
	return sql;
}

function createList(list: any): any {
	let isChildList = list.isForChild;
	let listGroups = list.groups;
	let listName = list.name;
	let listOwner = list.owner;

	let sql = '';
	return sql;
}

function createItem(item: any): any {
	let name = item.name;
	let description = item.description;

	let sql = '';
	return sql;
}

function createGroupMember(GroupMember: any): any {
	let name = GroupMember.name;
	let description = GroupMember.description;

	let sql = '';
	return sql;
}
