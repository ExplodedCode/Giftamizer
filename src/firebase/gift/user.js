import { firebaseAuth } from '../constants';

import socketIOClient from 'socket.io-client';
var socket = socketIOClient(window.location.hostname.includes('localhost') ? '//localhost:8080' : '//' + window.location.hostname);

export function saveAccountDisplay(display) {
	return new Promise((resolve, reject) => {
		socket.emit('set:userData', {
			uid: firebaseAuth().currentUser.uid,
			display: display,
		});
		resolve('ok');
	});
}
