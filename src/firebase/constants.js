import firebase from 'firebase';

const config = {
	apiKey: 'AIzaSyAwznX0p0-Zy76F69JACYpJ74gBvyY0qbU',
	authDomain: 'giftamizer-trowbridge.firebaseapp.com',
	databaseURL: 'https://giftamizer-trowbridge.firebaseio.com',
	projectId: 'giftamizer-trowbridge',
	storageBucket: 'giftamizer-trowbridge.appspot.com',
	messagingSenderId: '113672954512',
	appId: '1:113672954512:web:9fd5a3b8bbdafe8f356e15',
};

firebase.initializeApp(config);

export const db = firebase.firestore();
export const storage = firebase.storage();
export const firebaseAuth = firebase.auth;
