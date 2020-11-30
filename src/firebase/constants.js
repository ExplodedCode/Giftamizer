import firebase from 'firebase';

const config = {
	apiKey: 'AIzaSyBsI0kZhT2_47LHhL0q5oPQUPG-TOc01hY',
	authDomain: 'gift-group.firebaseapp.com',
	databaseURL: 'https://gift-group.firebaseio.com',
	projectId: 'gift-group',
	storageBucket: 'gift-group.appspot.com',
	messagingSenderId: '809768496750',
	appId: '1:809768496750:web:d23126a795df7bfa79807f',
};

firebase.initializeApp(config);

export const db = firebase.firestore();
export const storage = firebase.storage();
export const firebaseAuth = firebase.auth;
