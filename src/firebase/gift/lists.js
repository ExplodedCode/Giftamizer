import { db, firebaseAuth } from '../constants';

export function getMyLists() {
	var docRef = db.collection('lists').where('owner', '==', firebaseAuth().currentUser.uid).orderBy('name');

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

export function getMyGroups() {
	var docRef = db.collection('groups').where('members', 'array-contains', firebaseAuth().currentUser.uid).orderBy('name');

	return docRef
		.get()
		.then(function (querySnapshot) {
			var groups = [];
			querySnapshot.forEach(function (doc) {
				groups.push({ name: doc.data().name, id: doc.data().id });
			});
			return groups;
		})
		.catch(function (error) {
			console.log('Error getting documents: ', error);
			return 'error';
		});
}

export function createList(name, groups, isForChild) {
	var listsRef = db.collection('lists');

	var list = { name: name, groups: groups, isForChild: isForChild };

	list.owner = firebaseAuth().currentUser.uid;

	return listsRef
		.add(list, { merge: true })
		.then(function (docRef) {
			return 'ok';
		})
		.catch(function (error) {
			return error;
		});
}

export function editList(id, name, groups, isForChild) {
	var listsRef = db.collection('lists').doc(id);

	var list = { name: name, groups: groups, isForChild: isForChild };

	list.owner = firebaseAuth().currentUser.uid;

	return listsRef
		.set(list, { merge: true })
		.then(function (docRef) {
			return 'ok';
		})
		.catch(function (error) {
			return error;
		});
}

export function deleteList(id) {
	var listsRef = db.collection('lists').doc(id);

	return listsRef
		.delete()
		.then(function () {
			return 'ok';
		})
		.catch(function (error) {
			console.error('Error removing document: ', error);
			return 'error';
		});
}

export function getListDetails(list) {
	var docRef = db.collection('lists').doc(list);

	return docRef
		.get()
		.then(function (doc) {
			if (doc.exists) {
				return doc.data();
			} else {
				return 'not found';
			}
		})
		.catch(function (error) {
			console.log('Error getting documents: ', error);
			return 'error';
		});
}
