import { db, firebaseAuth } from '../constants';

export function getMyGroups() {
	var docRef = db.collection('groups').where('members', 'array-contains', firebaseAuth().currentUser.uid);

	return docRef
		.get()
		.then(function (querySnapshot) {
			querySnapshot.forEach(function (doc) {
				// doc.data() is never undefined for query doc snapshots
				console.log(doc.id, ' => ', doc.data());
			});
			return querySnapshot;
		})
		.catch(function (error) {
			console.log('Error getting documents: ', error);
		});
}

export function editMyGroup(group) {
	console.log(group);

	var groupRef = db.collection('groups').doc(group.id);

	return groupRef
		.set(group, { merge: true })
		.then(function (docRef) {
			return 'ok';
		})
		.catch(function (error) {
			return error;
		});
}
