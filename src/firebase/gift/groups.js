import { firebaseAuth, endpoint } from '../constants';

import socketIOClient from 'socket.io-client';
var socket = socketIOClient(endpoint);

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

export function deleteGroup(id) {
	return new Promise((resolve, reject) => {
		socket.emit('req:deleteGroup', { groupId: id, userId: firebaseAuth().currentUser.uid });
		socket.on('res:deleteGroup', (result) => {
			socket.off('res:deleteGroup');
			resolve(result);
		});
	});
}

export function starGroup(groupId) {
	return new Promise((resolve, reject) => {
		socket.emit('star:group', {
			groupId: groupId,
			userId: firebaseAuth().currentUser.uid,
		});

		socket.on('res:star:group', (result) => {
			socket.emit('req:userData', firebaseAuth().currentUser.uid);
			socket.off('res:star:group');

			resolve(result);
		});
	});
}
