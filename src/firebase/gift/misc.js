import React, { useEffect } from 'react';

import socketIOClient from 'socket.io-client';

import { firebaseAuth } from '../constants';

import Chip from '@material-ui/core/Chip';

var socket = socketIOClient(window.location.hostname.includes('localhost') ? '//localhost:8080' : '//' + window.location.hostname);

export function GroupChip({ groupId }) {
	const [group, setGroup] = React.useState('');

	useEffect(() => {
		getGroup(groupId).then((result) => {
			setGroup(result.name);
		});
	});

	return group !== '' ? <Chip size='small' label={group} style={{ marginRight: 4 }} /> : <span />;
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
			try {
				setName(result.name);
			} catch {
				setName('');
			}
		});
	});

	return name !== '' ? <Chip size='small' label={name} style={{ marginRight: 4 }} /> : <span />;
}
function getList(listId) {
	return new Promise((resolve, reject) => {
		socket.emit('req:listName', {
			listId: listId,
		});
		console.log(listId);

		socket.on('res:listName:' + listId, (result) => {
			socket.off('res:listName:' + listId);
			resolve(result);
		});
	});
}
