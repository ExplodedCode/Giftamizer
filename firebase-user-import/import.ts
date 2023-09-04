import moment from 'moment';
import axios from 'axios';
import fs from 'fs';
import { Pool } from 'pg';
import { v5 as uuidv5 } from 'uuid';
import { supabase } from './api';

const urlMetadata = require('./metadata');

require('dotenv').config();
const MY_NAMESPACE = '41b5d276-b876-4a17-9001-c3efb574814a';

// Generate Firebase Export
// https://firebase.google.com/docs/cli/auth#authexport
const users = require('./users.json');
const profiles = require('./profiles.json');
const groups = require('./groups.json');
const lists = require('./lists.json');
const items = require('./items.json');

// User Data Objects
let userRows: any[] = [];
let userImages: any[] = [];
let userProfiles: any[] = [];

// Group Data Objects
let groupRows: any[] = [];
let groupImages: any[] = [];
let groupMembers: any[] = [];

// List Data Objects
let listRows: any[] = [];
let listGroups: any[] = [];

// Item Data Objects
let itemRows: any[] = [];
let itemImages: any[] = [];
let itemLists: any[] = [];
let itemStatus: any[] = [];

// SQL Object
let sql = '';

(async function () {
	// Setup Supabase Connection
	const pool = new Pool({
		host: process.env.POSTGRES_HOST,
		port: parseInt(process.env.POSTGRES_PORT || '5432'),
		user: process.env.POSTGRES_USER,
		password: process.env.POSTGRES_PASSWORD,
		database: 'postgres',
	});

	// Import Flags
	let importUsers = true;
	let importGroups = true;
	let importLists = true;
	let importItems = true;
	let exportSQLFile = true;
	let importImages = false;

	if (importUsers) {
		// Get Firebase Users
		users.forEach((user: any) => {
			// Import Firebase users into Supabase Data Object
			userRows.push(createUser(user));
		});

		// Get Mongo Profiles
		profiles.forEach((profile: any) => {
			// Import Mongo profiles into Supabase Data Object
			userProfiles.push(createUserProfile(profile));
		});

		// Create SQL object for new Supabase Users
		let userSql = createUserHeader() + userRows.join(',\n') + 'ON CONFLICT DO NOTHING RETURNING *;';
		sql += userSql;

		// Get Mongo Profiles
		profiles.forEach((profile: any) => {
			// Import Mongo user images into Supabase Data Object
			userImages.push(createUserImage(profile));

			// Import User Profiles ??
		});
	}

	if (importGroups) {
		// Get Groups from Mongo
		groups.forEach((group: any) => {
			// Import Group into Supabase Data Object
			groupRows.push(createGroup(group));

			// Get Group Images to import into Supabase Data Object
			groupImages.push(createGroupImage(group));

			// Get Group Members
			group.members.forEach((member: any) => {
				// Import into Supabase Data Object
				groupMembers.push(createGroupMember(group.id, member, group.owner));
			});
		});

		// Generate Group Creation SQL
		sql += createGroupHeader() + groupRows.join(',\n') + 'ON CONFLICT DO NOTHING RETURNING *;';

		// Generate Group Memnber SQL
		sql += createGroupMemberHeader() + groupMembers.join(',\n') + 'ON CONFLICT DO NOTHING RETURNING *;';
	}

	if (importLists) {
		// Get Lists from Mongo
		lists.forEach((list: any) => {
			// Get List Count
			let count = lists.filter((listObj: any) => listObj.owner === list.owner).length;

			// Add Lists if needed
			if (count > 1) {
				// Enable Lists on Profile
				sql += `\nUPDATE profiles SET enable_lists = true WHERE user_id = '${uuidv5(list.owner, MY_NAMESPACE)}';`;

				// Create Lists
				listRows.push(createList(list));

				// Loop through Groups
				list.groups.forEach((listGroup: any) => {
					// Import into Supabase Data Object
					listGroups.push(createListsGroups(list._id['$oid'], listGroup, list.owner));
				});
			}
		});

		// Import Lists into Supabase
		sql += createListHeader() + listRows.join(',\n') + 'ON CONFLICT DO NOTHING RETURNING *;';

		// Import Lists into lists_groups
		sql += createListGroupHeader() + listGroups.join(',\n') + 'ON CONFLICT DO NOTHING RETURNING *;';
	}

	if (importItems) {
		// Get Items from Mongo
		items.forEach((item: any) => {
			itemRows.push(createItem(item));

			// Get Item Lists
			item.lists?.forEach((itemList: any) => {
				let count = lists.filter((listObj: any) => listObj.owner === item.owner).length;

				if (count > 1) {
					// Import into Supabase Data Object
					itemLists.push(createItemList(item._id['$oid'], itemList, item.owner));
				}
			});

			if (item?.status) {
				// Import into Supabase Data Object
				let status = item.status === 'planned' ? 'P' : item.status === 'unavailable' ? 'U' : undefined;
				if (status) itemStatus.push(createItemStatus(item._id['$oid'], item.takenBy, status));
			}
		});

		//Import Lists into Items
		sql += createItemHeader() + itemRows.join(',\n') + 'ON CONFLICT DO NOTHING RETURNING *;';

		// Import Item Lists into items_lists
		sql += createItemListHeader() + itemLists.join(',\n') + 'ON CONFLICT DO NOTHING RETURNING *;';

		// Import Item Status into items_status
		sql += createItemStatusHeader() + itemStatus.join(',\n') + 'ON CONFLICT DO NOTHING RETURNING *;';
	}

	// Execute New User SQL creation script

	if (importImages) {
		// Import User Images
		for (let userImage of userImages) {
			if (userImage.image?.startsWith('data:')) {
				let buf = Buffer.from(userImage.image.split(';base64,').pop(), 'base64');
				const { error: imageError } = await supabase.storage.from('avatars').upload(`${uuidv5(userImage.id, MY_NAMESPACE)}`, buf, {
					contentType: 'image/png',
					cacheControl: '3600',
					upsert: true,
				});

				if (imageError) {
					console.log(imageError);
				} else {
					console.log(`User Image Complete!`);
					sql += `\nUPDATE public.profiles SET avatar_token = ${moment().unix()} WHERE user_id = '${uuidv5(userImage.id, MY_NAMESPACE)}'; `;
				}
			}
		}

		// Import Group Images
		for (let groupImage of groupImages) {
			if (groupImage.image?.startsWith('data:')) {
				let buf = Buffer.from(groupImage.image.split(';base64,').pop(), 'base64');
				const { error: imageError } = await supabase.storage.from('groups').upload(`${uuidv5(groupImage.id, MY_NAMESPACE)}`, buf, {
					contentType: 'image/png',
					cacheControl: '3600',
					upsert: true,
				});

				if (imageError) {
					console.log(imageError);
				} else {
					console.log(`Group Image Complete!`);
					sql += `\nUPDATE public.groups SET image_token = ${moment().unix()} WHERE id = '${uuidv5(groupImage.id, MY_NAMESPACE)}'; `;
				}
			}
		}

		// import item images
		if (importItems) {
			for (let item of items) {
				if (item?.image?.length > 0) {
					let img = await getImageAsBase64(item.image);
					if (img !== '') {
						let buf = Buffer.from(img.split(';base64,')[1], 'base64');
						const { error: imageError } = await supabase.storage.from('items').upload(`${uuidv5(item._id['$oid'], MY_NAMESPACE)}`, buf, {
							contentType: 'image/png',
							cacheControl: '3600',
							upsert: true,
						});

						if (imageError) {
							console.log(imageError);
						} else {
							console.log(`Item Image Complete!`);
							sql += `\nUPDATE public.items SET image_token = ${moment().unix()} WHERE id = '${uuidv5(item._id['$oid'], MY_NAMESPACE)}'; `;
						}
					}
				}
			}
		}
	}

	sql += `\n\nupdate storage.buckets set public = true WHERE id = 'avatars' OR id = 'groups' OR id = 'lists' OR id = 'items';`;

	// Save copy of SQL script
	if (exportSQLFile) {
		fs.writeFile('import.sql', sql, () => {});
	}

	let sqlRes = await pool.query(sql);
	console.log(`SQL Complete!`);
	pool.end();
})();

// Create Headers
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
		id,
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

function createListHeader() {
	return `INSERT INTO public.lists (
		id, 
		user_id, 
		name,
		child_list) VALUES `;
}

function createListGroupHeader() {
	return `INSERT INTO public.lists_groups (
		list_id, 
		group_id, 
		user_id) VALUES `;
}

function createItemHeader() {
	return `INSERT INTO public.items (
		id, 
		user_id, 
		name,
		description,
		links) VALUES `;
}

function createItemListHeader() {
	return `INSERT INTO public.items_lists (
		item_id, 
		list_id, 
		user_id) VALUES `;
}

function createItemStatusHeader() {
	return `INSERT INTO public.items_status (
		item_id, 
		user_id, 
		status) VALUES `;
}

// Create SQL
function createUser(user: any) {
	let user_metadata = user.metadata;

	let splits = user_metadata.name.split(' ');
	user_metadata.first_name = splits[0];
	user_metadata.last_name = splits[splits.length - 1];

	let sql = `(
        '00000000-0000-0000-0000-000000000000', /* instance_id */
        '${uuidv5(user.uid, MY_NAMESPACE)}', /* id */
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

function createUserImage(profile: any): any {
	let userID = profile.uid;
	let userImageData = profile.backgroundValue;

	let userImage = {
		id: userID,
		image: userImageData,
	};
	return userImage;
}

function createUserProfile(profile: any): any {
	let name = profile.name;
	let description = profile.description;

	let sql = '';
	return sql;
}

function createGroup(group: any): any {
	let groupID = uuidv5(group.id, MY_NAMESPACE);
	let groupName = group.name;
	let token = group.backgroundType == 'image' ? moment().unix() : 'null';

	let sql = `('${groupID}','${groupName.replaceAll(`'`, `''`)}', ${token})`;
	return sql;
}

function createGroupImage(group: any): any {
	let groupID = group.id;
	let groupImageData = group.backgroundValue;

	let groupImage = {
		id: groupID,
		image: groupImageData,
	};
	return groupImage;
}

function createList(list: any): any {
	let listID = uuidv5(list._id['$oid'], MY_NAMESPACE);
	let isChildList = list.isForChild;
	let listName = list.name;
	let listOwner = uuidv5(list.owner, MY_NAMESPACE);
	//let listGroups = list.groups;

	let sql = `('${listID}','${listOwner}','${listName.replaceAll(`'`, `''`).replaceAll(`’`, `''`)}','${isChildList}')`;
	return sql;
}

function createListsGroups(mongoListID: any, mongoGroupID: any, mongoOwner: any): any {
	let listID = uuidv5(mongoListID, MY_NAMESPACE);
	let groupID = uuidv5(mongoGroupID, MY_NAMESPACE);
	let userID = uuidv5(mongoOwner, MY_NAMESPACE);

	let sql = `('${listID}','${groupID}','${userID}')`;
	return sql;
}

function createItem(item: any): any {
	let item_id = uuidv5(item._id['$oid'], MY_NAMESPACE);
	let user_id = uuidv5(item.owner, MY_NAMESPACE);
	let name = item.name;
	let description = item.description;
	let link = item.url;

	let sql = `('${item_id}','${user_id}','${name.replaceAll(`'`, `''`).replaceAll(`’`, `''`)}','${description.replaceAll(`'`, `''`).replaceAll(`’`, `''`)}', ARRAY ['${link}'])`;
	return sql;
}

function createGroupMember(mongoGroupID: any, mongoMemberID: any, mongoOwnerID: any): any {
	let groupID = uuidv5(mongoGroupID, MY_NAMESPACE);
	let userID = uuidv5(mongoMemberID, MY_NAMESPACE);
	let owner = mongoMemberID == mongoOwnerID;
	let invite = false;
	let pinned = false;

	let sql = `('${groupID}', '${userID}', ${owner},${invite},${pinned})`;
	return sql;
}

function createItemList(mongoItemID: any, mongoListID: any, mongoOwner: any): any {
	let itemID = uuidv5(mongoItemID, MY_NAMESPACE);
	let listID = uuidv5(mongoListID, MY_NAMESPACE);
	let userID = uuidv5(mongoOwner, MY_NAMESPACE);

	let sql = `('${itemID}','${listID}','${userID}')`;
	return sql;
}

function createItemStatus(mongoItemID: any, mongoUserID: any, status: any): any {
	let itemID = uuidv5(mongoItemID, MY_NAMESPACE);
	let listID = uuidv5(mongoUserID, MY_NAMESPACE);

	let sql = `('${itemID}','${listID}','${status}')`;
	return sql;
}

// Misc Functions
function FakeDelay(time?: number) {
	return new Promise((resolve) => {
		const delay = time ?? Math.floor(Math.random() * (650 - 350 + 1)) + 350;
		setTimeout(resolve, delay);
	});
}
async function getImageAsBase64(imageUrl: string): Promise<string> {
	return new Promise(async (resolve, reject) => {
		try {
			const response = await axios.get(imageUrl, {
				responseType: 'arraybuffer',
			});

			resolve(`data:${response.headers['content-type']};base64,${Buffer.from(response.data, 'binary').toString('base64')}`);
		} catch (error) {
			resolve('');
		}
	});
}
