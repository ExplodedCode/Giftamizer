import firebase from 'firebase';

// const firebaseConfig  = {
// 	apiKey: 'AIzaSyBsI0kZhT2_47LHhL0q5oPQUPG-TOc01hY',
// 	authDomain: 'gift-group.firebaseapp.com',
// 	databaseURL: 'https://gift-group.firebaseio.com',
// 	projectId: 'gift-group',
// 	storageBucket: 'gift-group.appspot.com',
// 	messagingSenderId: '809768496750',
// 	appId: '1:809768496750:web:d23126a795df7bfa79807f',
// };

// testing
const firebaseConfig = {
	apiKey: 'AIzaSyAwznX0p0-Zy76F69JACYpJ74gBvyY0qbU',
	authDomain: 'giftamizer-trowbridge.firebaseapp.com',
	databaseURL: 'https://giftamizer-trowbridge.firebaseio.com',
	projectId: 'giftamizer-trowbridge',
	storageBucket: 'giftamizer-trowbridge.appspot.com',
	messagingSenderId: '113672954512',
	appId: '1:113672954512:web:9fd5a3b8bbdafe8f356e15',
};

firebase.initializeApp(firebaseConfig);

export const db = firebase.firestore();
export const storage = firebase.storage();
export const firebaseAuth = firebase.auth;
