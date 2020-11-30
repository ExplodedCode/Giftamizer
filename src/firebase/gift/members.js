import firebase from 'firebase';

import { db } from '../constants';

export function getGroupMemberIds(groupId) {
	var docRef = db.collection('groups').doc(groupId);

	return docRef
		.get()
		.then(function (doc) {
			if (doc.exists) {
				return doc.data();
			} else {
				// doc.data() will be undefined in this case
				console.log('No such document!');
			}
		})
		.catch(function (error) {
			console.log('Error getting document:', error);
		});
}

export function getUserInfo(userId) {
	var docRef = db.collection('users').doc(userId);

	return docRef
		.get()
		.then(function (doc) {
			if (doc.exists) {
				var user = doc.data();
				user.id = doc.id;
				return user;
			} else {
				// doc.data() will be undefined in this case
				console.log('No such document!');
			}
		})
		.catch(function (error) {
			console.log('Error getting document:', error);
		});
}

export function removeMember(groupId, userId) {
	var groupRef = db.collection('groups').doc(groupId);

	return groupRef
		.set(
			{
				members: firebase.firestore.FieldValue.arrayRemove(userId),
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

export function getNonUserLists(groupId) {
	var docRef = db.collection('lists').where('isForChild', '==', true).where('groups', 'array-contains', groupId);

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
