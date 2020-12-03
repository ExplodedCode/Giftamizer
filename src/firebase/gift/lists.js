import { db, firebaseAuth } from '../constants';

import socketIOClient from 'socket.io-client';
var socket = socketIOClient(window.location.hostname.includes('localhost') ? '//localhost:8080' : '//' + window.location.hostname);

export function getMyGroups() {
	return new Promise((resolve, reject) => {
		socket.emit('req:listsMyGroups', firebaseAuth().currentUser.uid);

		socket.on('res:listsMyGroups', (result) => {
			console.log(result);
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
	var listsRef = db.collection('lists').doc(id);

	var list = { name: name, groups: groups, isForChild: isForChild };

	list.owner = firebaseAuth().currentUser.uid;

	return listsRef
		.set(list, { merge: true })
		.then(function (docRef) {
			return 'ok';
		})
		.catch(function (error) {
			return error;
		});
}

export function deleteList(id) {
	var listsRef = db.collection('lists').doc(id);

	return listsRef
		.delete()
		.then(function () {
			return 'ok';
		})
		.catch(function (error) {
			console.error('Error removing document: ', error);
			return 'error';
		});
}

export function getListDetails(list) {
	var docRef = db.collection('lists').doc(list);

	return docRef
		.get()
		.then(function (doc) {
			if (doc.exists) {
				return doc.data();
			} else {
				return 'not found';
			}
		})
		.catch(function (error) {
			console.log('Error getting documents: ', error);
			return 'error';
		});
}
