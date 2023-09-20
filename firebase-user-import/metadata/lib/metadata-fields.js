const clean = require('./clean');

module.exports = MetadataFields;

/**
 * @ctor MetadataFields (chainable)
 * Returns basic metadata fields whose values will be filled in by the parser
 * after url request response. Most of these are Open Graph Protocol (og:) so
 * far: http://ogp.me/
 *
 */

function MetadataFields(options) {
	this.options = options || {};
	this.fields = {
		url: null,
		canonical: null,
		title: null,
		image: null,
		author: null,
		description: null,
		keywords: null,
		source: null,
		price: null,
		priceCurrency: null,
		availability: null,
		robots: null,
		jsonld: {},

		'og:url': null,
		'og:locale': null,
		'og:locale:alternate': null,
		'og:title': null,
		'og:type': null,
		'og:description': null,
		'og:determiner': null,
		'og:site_name': null,
		'og:image': null,
		'og:image:secure_url': null,
		'og:image:type': null,
		'og:image:width': null,
		'og:image:height': null,

		'twitter:title': null,
		'twitter:description': null,
		'twitter:image': null,
		'twitter:image:alt': null,
		'twitter:card': null,
		'twitter:site': null,
		'twitter:site:id': null,
		'twitter:url': null,
		'twitter:account_id': null,
		'twitter:creator': null,
		'twitter:creator:id': null,
		'twitter:player': null,
		'twitter:player:width': null,
		'twitter:player:height': null,
		'twitter:player:stream': null,
		'twitter:app:name:iphone': null,
		'twitter:app:id:iphone': null,
		'twitter:app:url:iphone': null,
		'twitter:app:name:ipad': null,
		'twitter:app:id:ipad': null,
		'twitter:app:url:ipad': null,
		'twitter:app:name:googleplay': null,
		'twitter:app:id:googleplay': null,
		'twitter:app:url:googleplay': null,

		responseBody: null,
	};

	return this;
}

/**
 * @method `configureType` (chainable)
 * @param {string} `type`
 * Returns properties belonging to global types that are grouped into
 * verticals and generally agreed upon. In the following example, "music.song"
 * would be the type passed as an argument into this method. This method
 * currently only supports type `article`, however.
 * <meta property="og:type" content="music.song" />
 *
 * TODO: music, audio, video
 */
MetadataFields.prototype.configureType = function (type) {
	if (!type || typeof type !== 'string') return this;
	const fieldsByType = {
		article: {
			'article:published_time': null,
			'article:modified_time': null,
			'article:expiration_time': null,
			'article:author': null,
			'article:section': null,
			'article:tag': null,
			'og:article:published_time': null,
			'og:article:modified_time': null,
			'og:article:expiration_time': null,
			'og:article:author': null,
			'og:article:section': null,
			'og:article:tag': null,
		},
	};
	if (fieldsByType[type]) this.fields = Object.assign({}, this.fields, fieldsByType[type]);
	return this;
};

/**
 * @method `lockKeys` (chainable)
 * Freeze metadata keys via Object.seal
 */
MetadataFields.prototype.lockKeys = function () {
	Object.seal(this.fields);
	return this;
};

/**
 * @method `set` (chainable)
 * @param obj must be in the form of {key: value}
 */
MetadataFields.prototype.set = function (obj) {
	if (obj) this.fields = Object.assign({}, this.fields, obj);
	return this;
};

/**
 * @method `get`
 * @param key {string}
 */
MetadataFields.prototype.get = function (key) {
	return this.fields[key];
};

/**
 * @method `clean` (chainable)
 * clean up and return all fields
 */
MetadataFields.prototype.clean = function () {
	const self = this;
	Object.keys(this.fields).forEach(function (key) {
		self.fields[key] = clean(key, self.fields[key], self.options);
	});
	return this.fields;
};
