import { firebaseAuth, endpoint } from '../constants';

import socketIOClient from 'socket.io-client';
var socket = socketIOClient(endpoint);

export function saveAccountDisplay(display) {
	return new Promise((resolve, reject) => {
		socket.emit('set:userData', {
			uid: firebaseAuth().currentUser.uid,
			display: display,
		});
		resolve('ok');
	});
}
export function setAccountEmail(email) {
	return new Promise((resolve, reject) => {
		socket.emit('set:userData', {
			uid: firebaseAuth().currentUser.uid,
			display: { email: email },
		});
		resolve('ok');
	});
}
