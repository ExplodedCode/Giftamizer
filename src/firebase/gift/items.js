import { firebaseAuth } from '../constants';

import socketIOClient from 'socket.io-client';
var socket = socketIOClient(window.location.hostname.includes('localhost') ? '//localhost:8080' : '//' + window.location.hostname);

export function getMyLists() {
	return new Promise((resolve, reject) => {
		socket.emit('req:listsData', firebaseAuth().currentUser.uid);
		socket.on('res:listsData', (result) => {
			if (result) {
				var lists = [];
				result.forEach((list) => {
					lists.push({ name: list.name, id: list._id });
				});

				socket.off('res:listsData');
				resolve(lists);
			} else {
				socket.off('res:listsData');
				return 'error';
			}
		});
	});
}

export function createItem(item) {
	item.owner = firebaseAuth().currentUser.uid;

	return new Promise((resolve, reject) => {
		socket.emit('add:item', item);
		socket.emit('req:itemsData', firebaseAuth().currentUser.uid);
		resolve('ok');
	});
}

export function editItem(id, item) {
	return new Promise((resolve, reject) => {
		socket.emit('set:item', {
			_id: id,
			...item,
			editor: firebaseAuth().currentUser.uid,
		});

		socket.on('res:set:item', (result) => {
			socket.off('res:set:item');
			resolve(result);
		});
	});
}

export function deleteItem(id) {
	return new Promise((resolve, reject) => {
		socket.emit('req:deleteItem', { itemId: id, userId: firebaseAuth().currentUser.uid });
		socket.on('res:deleteItem', (result) => {
			socket.off('res:deleteItem');
			resolve(result);
		});
	});
}

export function setStatus(id, status) {
	return new Promise((resolve, reject) => {
		socket.emit('set:itemStatus', {
			itemId: id,
			status: status,
			takenBy: firebaseAuth().currentUser.uid,
		});

		socket.on('res:itemStatus', (result) => {
			socket.off('res:itemStatus');
			resolve('ok');
		});
	});
}
