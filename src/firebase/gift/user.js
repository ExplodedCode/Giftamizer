import { db, firebaseAuth } from '../constants';

export function saveAccountDisplay(display) {
	var groupRef = db.collection('users').doc(firebaseAuth().currentUser.uid);

	return groupRef
		.set(display, { merge: true })
		.then(function (docRef) {
			return 'ok';
		})
		.catch(function (error) {
			console.log('Error writting document:', error);
			return 'error';
		});
}
