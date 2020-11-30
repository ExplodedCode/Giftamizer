import React, { useEffect } from 'react';

import { db } from '../constants';

import Chip from '@material-ui/core/Chip';

export function GroupChip({ groupId }) {
	const [name, setName] = React.useState('');

	useEffect(() => {
		getGroup(groupId).then((result) => {
			setName(result);
		});
	});

	return <Chip size='small' label={name} style={{ marginRight: 4 }} />;
}
function getGroup(groupId) {
	var docRef = db.collection('groups').doc(groupId);

	return docRef
		.get()
		.then(function (doc) {
			if (doc.exists) {
				return doc.data().name;
			} else {
				return 'Group not found!';
			}
		})
		.catch(function (error) {
			return 'Error getting group!';
		});
}

export function ListChip({ listId }) {
	const [name, setName] = React.useState('');

	useEffect(() => {
		getList(listId).then((result) => {
			setName(result);
		});
	});

	return <Chip size='small' label={name} style={{ marginRight: 4 }} />;
}
function getList(listId) {
	var docRef = db.collection('lists').doc(listId);

	return docRef
		.get()
		.then(function (doc) {
			if (doc.exists) {
				return doc.data().name;
			} else {
				return 'List not found!';
			}
		})
		.catch(function (error) {
			return 'Error getting list!';
		});
}
