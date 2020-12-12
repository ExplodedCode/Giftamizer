import { firebaseAuth } from '../constants';

import socketIOClient from 'socket.io-client';
var socket = socketIOClient('https://api.giftamizer.com');

export function saveAccountDisplay(display) {
	return new Promise((resolve, reject) => {
		socket.emit('set:userData', {
			uid: firebaseAuth().currentUser.uid,
			display: display,
		});
		resolve('ok');
	});
}
