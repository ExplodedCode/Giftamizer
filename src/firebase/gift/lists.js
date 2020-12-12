import { firebaseAuth } from '../constants';

import socketIOClient from 'socket.io-client';
var socket = socketIOClient('https://api.giftamizer.com');

export function getMyGroups() {
	return new Promise((resolve, reject) => {
		socket.emit('req:listsMyGroups', firebaseAuth().currentUser.uid);

		socket.on('res:listsMyGroups', (result) => {
			socket.off('res:listsMyGroups');
			resolve(result);
		});
	});
}

export function createList(name, groups, isForChild) {
	var list = { name: name, groups: groups, isForChild: isForChild, owner: firebaseAuth().currentUser.uid };

	return new Promise((resolve, reject) => {
		socket.emit('add:list', list);
		socket.emit('req:listsData', firebaseAuth().currentUser.uid);
		resolve('ok');
	});
}

export function editList(id, name, groups, isForChild) {
	var list = { _id: id, name: name, groups: groups, isForChild: isForChild };

	list.owner = firebaseAuth().currentUser.uid;

	return new Promise((resolve, reject) => {
		socket.emit('set:list', {
			...list,
			editor: firebaseAuth().currentUser.uid,
		});

		socket.on('res:set:list', (result) => {
			socket.off('res:set:list');
			resolve(result);
		});
	});
}

export function deleteList(id) {
	return new Promise((resolve, reject) => {
		socket.emit('req:deleteList', { listId: id, userId: firebaseAuth().currentUser.uid });
		socket.on('res:deleteList', (result) => {
			socket.off('res:deleteList');
			resolve(result);
		});
	});
}

export function getListDetails(list) {
	return new Promise((resolve, reject) => {
		socket.emit('req:listData', list);
		socket.on('res:listData', (result) => {
			socket.off('res:listData');
			resolve(result);
		});
	});
}
