import firebase from 'firebase';

import { db, firebaseAuth } from '../constants';

export function getMyGroups() {
	var docRef = db.collection('groups').where('members', 'array-contains', firebaseAuth().currentUser.uid).orderBy('name');

	return docRef
		.get()
		.then(function (querySnapshot) {
			return querySnapshot;
		})
		.catch(function (error) {
			console.log('Error getting documents: ', error);
			return 'error';
		});
}

export function editMyGroup(group) {
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

export function createGroup(group) {
	const id = guid_get();

	var groupRef = db.collection('groups').doc(id);

	group.id = id;
	group.owner = firebaseAuth().currentUser.uid;
	group.members = [firebaseAuth().currentUser.uid];

	return groupRef
		.set(group, { merge: true })
		.then(function (docRef) {
			return 'ok';
		})
		.catch(function (error) {
			return error;
		});
}
function guid_get() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}
	return s4() + s4() + s4();
}

export function joinGroup(groupId) {
	var docRef = db.collection('groups').doc(groupId);

	return docRef
		.get()
		.then(function (doc) {
			if (doc.exists) {
				joinGroupAct(groupId);
			} else {
				// doc.data() will be undefined in this case
				return 'notfound';
			}
		})
		.catch(function (error) {
			console.log('Error getting document:', error);
			return 'error';
		});
}
function joinGroupAct(groupId) {
	var groupRef = db.collection('groups').doc(groupId);

	return groupRef
		.set(
			{
				members: firebase.firestore.FieldValue.arrayUnion(firebaseAuth().currentUser.uid),
			},
			{ merge: true }
		)
		.then(function (docRef) {
			return 'ok';
		})
		.catch(function (error) {
			console.log('Error writting document:', error);
			return 'error';
		});
}
