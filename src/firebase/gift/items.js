import firebase from 'firebase';

import { db, firebaseAuth } from '../constants';

export function getMyItems(listID = '') {
	var docRef = db.collection('items').where('owner', '==', firebaseAuth().currentUser.uid).orderBy('name');
	if (listID !== '') {
		docRef = db.collection('items').where('owner', '==', firebaseAuth().currentUser.uid).where('lists', 'array-contains', listID).orderBy('name');
	}

	console.log(listID);

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
			return 'error';
		});
}

export function getMyLists() {
	var docRef = db.collection('lists').where('owner', '==', firebaseAuth().currentUser.uid).orderBy('name');

	return docRef
		.get()
		.then(function (querySnapshot) {
			var lists = [];
			querySnapshot.forEach(function (doc) {
				lists.push({ name: doc.data().name, id: doc.id });
			});
			return lists;
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

export function createItem(item) {
	var itemsRef = db.collection('items');

	item.owner = firebaseAuth().currentUser.uid;

	console.log(item);

	return itemsRef
		.add(item, { merge: true })
		.then(function (docRef) {
			return 'ok';
		})
		.catch(function (error) {
			return error;
		});
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

export function editItem(id, item) {
	var itemsRef = db.collection('items').doc(id);

	return itemsRef
		.set(item, { merge: true })
		.then(function (docRef) {
			return 'ok';
		})
		.catch(function (error) {
			return error;
		});
}

export function deleteItem(id) {
	var itemsRef = db.collection('items').doc(id);

	return itemsRef
		.delete()
		.then(function () {
			return 'ok';
		})
		.catch(function (error) {
			console.error('Error removing document: ', error);
			return 'error';
		});
}

export function setStatus(id, status, takenBy) {
	var itemsRef = db.collection('items').doc(id);

	return itemsRef
		.set(
			{
				status: status,
				takenBy: takenBy,
			},
			{ merge: true }
		)
		.then(function (docRef) {
			return 'ok';
		})
		.catch(function (error) {
			return error;
		});
}
