import { firebaseAuth } from '../constants';

import socketIOClient from 'socket.io-client';
var socket = socketIOClient(window.location.hostname.includes('localhost') ? '//localhost:8080' : '//' + window.location.hostname);

export function editMyGroup(group) {
	return new Promise((resolve, reject) => {
		socket.emit('set:group', {
			...group,
			editor: firebaseAuth().currentUser.uid,
		});

		socket.on('res:set:group', (result) => {
			socket.off('res:set:group');
			resolve(result);
		});
	});
}

export function createGroup(group) {
	const id = guid_get();

	group.id = id;
	group.owner = firebaseAuth().currentUser.uid;
	group.members = [firebaseAuth().currentUser.uid];

	return new Promise((resolve, reject) => {
		socket.emit('add:group', group);
		socket.emit('req:groupsData', firebaseAuth().currentUser.uid);
		resolve('ok');
	});
}
function guid_get() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}
	return s4() + s4() + s4();
}

export function joinGroup(groupId) {
	return new Promise((resolve, reject) => {
		socket.emit('join:group', {
			groupId: groupId,
			userId: firebaseAuth().currentUser.uid,
		});

		socket.on('res:join:group', (result) => {
			socket.emit('req:groupsData', firebaseAuth().currentUser.uid);
			socket.off('res:join:group');
			resolve(result);
		});
	});
}
