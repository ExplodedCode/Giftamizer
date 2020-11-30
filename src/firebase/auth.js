import { db, firebaseAuth } from './constants';

export function signupWithEmailPassword(email, password, name) {
	return firebaseAuth()
		.createUserWithEmailAndPassword(email, password)
		.then((user) => {
			saveUser(user, name);
			return user;
		})
		.catch((error) => {
			return error;
		});
}

export function loginWithEmail(email, password) {
	// return firebaseAuth().signInWithEmailAndPassword(email, password);

	return firebaseAuth()
		.signInWithEmailAndPassword(email, password)
		.then((user) => {
			return user;
		})
		.catch((error) => {
			return error;
		});
}

export function resetPassword(email) {
	return firebaseAuth().sendPasswordResetEmail(email);
}

export function logout() {
	return firebaseAuth().signOut();
}

export function saveUser(user, name) {
	console.log('signup', user, name);

	var colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];

	return db
		.collection('users')
		.doc(user.user.uid)
		.set({
			email: user.user.email,
			uid: user.user.uid,
			displayName: name,
			photoURL:
				'https://firebasestorage.googleapis.com/v0/b/giftamizer-trowbridge.appspot.com/o/profileImages%2FVMeJief8YndOGsIMsF9IU9ymdFq1?alt=media&token=a8b913be-a485-41a3-85d3-d2f770208f06',
			backgroundValue: colors[Math.floor(Math.random() * colors.length)],
			backgroundType: 'color',
			textShade: 'light',
		})
		.then(function () {
			console.log('Document successfully written!');
		})
		.catch(function (error) {
			console.error('Error writing document: ', error);
		});
}

export function getUserProfile() {
	var docRef = db.collection('users').doc(firebaseAuth().currentUser.uid);
	return docRef
		.get()
		.then(function (doc) {
			return doc.data();
		})
		.catch(function (error) {
			console.log('Error getting document:', error);
		});
}

export function checkAmount() {
	let user = firebaseAuth().currentUser;

	if (user) {
		let userUID = user.uid;
		let docRef = db.collection('users').doc(userUID);

		return docRef
			.get()
			.then((doc) => {
				//Note the return here
				if (doc.exists) {
					let name = doc.data().displayName;
					if (name) {
						return name; //Note the return here
					}
				} else {
					console.log('No such document!');
					//Handle this situation the way you want! E.g. return false or throw an error
					return false;
				}
			})
			.catch((error) => {
				console.log('Error getting document:', error);
				//Handle this situation the way you want
			});
	} else {
		//Handle this situation the way you want
	}
}
