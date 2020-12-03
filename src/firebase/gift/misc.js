import React, { useEffect } from 'react';

import socketIOClient from 'socket.io-client';

import { db, firebaseAuth } from '../constants';

import Chip from '@material-ui/core/Chip';

var socket = socketIOClient(window.location.hostname.includes('localhost') ? '//localhost:8080' : '//' + window.location.hostname);

export function GroupChip({ groupId }) {
	const [group, setGroup] = React.useState('...');

	useEffect(() => {
		getGroup(groupId).then((result) => {
			setGroup(result.name);
		});
	});

	return <Chip size='small' key={Math.random()} label={group} style={{ marginRight: 4 }} />;
}
function getGroup(groupId) {
	return new Promise((resolve, reject) => {
		socket.emit('req:listGroupName', {
			groupId: groupId,
			userId: firebaseAuth().currentUser.uid,
		});

		socket.on('res:listGroupName:' + groupId, (result) => {
			socket.off('res:listGroupName:' + groupId);
			resolve(result);
		});
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
