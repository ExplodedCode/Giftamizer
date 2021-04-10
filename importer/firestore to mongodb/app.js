const firebase = require('firebase');

var connection_string = 'mongodb://root:qMhUXkqtFuvt4M6vdL6X@azure.trowbridge.tech:27017/Giftamizer?authSource=admin';
const mongodb = require('monk')(connection_string);

var validUrl = require('valid-url');
const urlMetadata = require('url-metadata');
const amazonScraper = require('amazon-buddy');
const amazonAsin = require('amazon-asin');

const firebaseConfig = {
	apiKey: 'AIzaSyBsI0kZhT2_47LHhL0q5oPQUPG-TOc01hY',
	authDomain: 'gift-group.firebaseapp.com',
	databaseURL: 'https://gift-group.firebaseio.com',
	projectId: 'gift-group',
	storageBucket: 'gift-group.appspot.com',
	messagingSenderId: '809768496750',
	appId: '1:809768496750:web:d23126a795df7bfa79807f',
};

firebase.initializeApp(firebaseConfig);
const firestoredb = firebase.firestore();

const mongodb_collection_users = mongodb.get('users');
const mongodb_collection_groups = mongodb.get('groups');
const mongodb_collection_lists = mongodb.get('lists');
const mongodb_collection_items = mongodb.get('items');

var list_xref = {
	'2skcjT4CVE4cqr1sBNbh': '5fd188115b1e680d1c0853a0',
	'4T053ZdQjiYylRuWaFwN': '5fd188115b1e680d1c0853a1',
	'4s215oktsEyEIDv3peL4': '5fd188115b1e680d1c0853a2',
	'9nBgyu55fDNSSoAu1dwl': '5fd188115b1e680d1c0853a3',
	CIq4LatOsLkJcBU0nQ05: '5fd188115b1e680d1c0853a4',
	DF8xod7LxNlvrXGEFrRI: '5fd188115b1e680d1c0853a5',
	K9zlGW0wVhU4Sev2S5nb: '5fd188115b1e680d1c0853a7',
	PuMrUEtCbN1OsCmVGn6G: '5fd188115b1e680d1c0853a8',
	ExbgPM3f02iP9vIUrlmS: '5fd188115b1e680d1c0853a6',
	Se3RPMtX4fOCUkFiN9HN: '5fd188115b1e680d1c0853a9',
	bBkftQ9bPrIkU5TTDUFY: '5fd188115b1e680d1c0853ad',
	SibhwJakLdgAi5XmIhSO: '5fd188115b1e680d1c0853aa',
	UwJXn9zx5BcxVWhXjblJ: '5fd188115b1e680d1c0853ab',
	b8XSAuOC6ctSKFxFkCpm: '5fd188115b1e680d1c0853ac',
	g5mGuH0pbRF97uHh5ksS: '5fd188115b1e680d1c0853ae',
	gjvgiIgJ90S4bTEcvheY: '5fd188115b1e680d1c0853af',
	hSHTGsAdIdf3Clz1UWht: '5fd188115b1e680d1c0853b0',
	i3UKiRjFb1nzYOMBoCeD: '5fd188115b1e680d1c0853b1',
	l8tWgneTFGyCWRGl8lmI: '5fd188115b1e680d1c0853b3',
	i5B2lCX141TxAZMAB791: '5fd188115b1e680d1c0853b2',
	mLE6QRwzI9tSHy3Edkwx: '5fd188115b1e680d1c0853b4',
	u5jqJl63s86wSISzeBOU: '5fd188115b1e680d1c0853b7',
	uSyWVokUNbjFcu44EQc0: '5fd188115b1e680d1c0853b8',
	ujN5ocRODDMYivJb96Pc: '5fd188115b1e680d1c0853b9',
	ovOt80rAv6qOB6edzb2I: '5fd188115b1e680d1c0853b6',
	nNwiqk65Sujus1BANIbZ: '5fd188115b1e680d1c0853b5',
	vsgslBEKs8yLAULvLy6z: '5fd188115b1e680d1c0853ba',
	ysrt62XPAY1I3CAvtX6U: '5fd188115b1e680d1c0853bc',
	ykubaXuSqI5Q2Vx4iHt9: '5fd188115b1e680d1c0853bb',
	yvLKczluMPbNg1xQadWF: '5fd188115b1e680d1c0853bd',
};

firestoredb
	.collection('items')
	.get()
	.then(async (querySnapshot) => {
		querySnapshot.forEach(async (doc) => {
			var item = doc.data();
			// user.photoURL = 'https://firebasestorage.googleapis.com/v0/b/gift-group.appspot.com/o/logo.png?alt=media&token=eed910fd-a1c0-4f90-b27d-f059cca6ee32';

			// doc.data() is never undefined for query doc snapshots
			// console.log(doc.id, ' => ', user.name);

			var newListIds = [];

			if (!item.url.includes('http://Fag.com')) {
				item.lists.forEach((list) => {
					newListIds.push(list_xref[list]);
				});

				item.lists = newListIds;

				getLinkImage(item);

				// mongodb_collection_items.insert({ ...list }).then((listNew) => {
				// 	// console.log(doc.id + ': ' + listNew._id);
				// });
			}
		});
	})
	.catch(function (error) {
		// console.log('Error getting documents: ', error);
	});

async function getLinkImage(item) {
	if (validUrl.isUri(item.url)) {
		// console.log('Looks like an URI:', item.url);

		var AmProduct = null;

		try {
			var amazonID = amazonAsin.syncParseAsin(item.url).ASIN;

			if (amazonID) {
				const product = await amazonScraper.asin({ asin: amazonID });

				AmProduct = product.result[0];

				var image = '';
				try {
					image = product.result[0].variants.filter((obj) => {
						return obj.asin === amazonID;
					})[0].images[0].large;
				} catch (error) {
					image = product.result[0].images[0];
				}

				if (image.startsWith('/') && !image.startsWith('//')) {
					image = item.url.split('/')[0] + '//' + item.url.split('/')[2] + image;
					// console.log(item.url, image);
				}

				// console.log('image!!!:', image);
				item.image = image;
				writeItem(item);
			} else {
				urlMetadata(item.url).then(
					function (metadata) {
						// console.log('image!!!:', metadata.image);

						var image = metadata.image;
						if (metadata.image.startsWith('/') && !metadata.image.startsWith('//')) {
							image = item.url.split('/')[0] + '//' + item.url.split('/')[2] + metadata.image;
						}

						item.image = image;
						writeItem(item);
					},
					function (error) {
						// failure handler
						// 	// console.log('error:', item.url);
						writeItem(item);
					}
				);
			}
		} catch (error) {
			// 	// console.log('error:', AmProduct);
			writeItem(item);
		}
	} else {
		// console.log('Not a URI:', item.url);
		writeItem(item);
	}
}

function writeItem(item) {
	// mongodb_collection_items.insert({ ...item }).then((listNew) => {
	// 	if (item.image !== '') {
	// 		// console.log('New Item:', item);
	// 	}
	// });
}
