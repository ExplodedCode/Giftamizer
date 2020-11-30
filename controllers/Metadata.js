const urlMetadata = require('url-metadata');
const amazonScraper = require('amazon-buddy');

module.exports = function (e, db) {
	var module = {};

	//  /api/syncUsers/:location/:tenant/:group
	module.get = async (request, response, next) => {
		try {
			var amazonRegex = RegExp('(http|https)://www.amazon.com/([\\w-]+/)?(dp|gp/product)/(\\w+/)?(\\w{10})');

			if (request.query.url.match(amazonRegex)) {
				var amazonID = '';
				m = request.query.url.match(amazonRegex);
				if (m) {
					amazonID = m[5];
				}

				const product = await amazonScraper.asin({ asin: amazonID });

				var image = product.result[0].variants.filter((obj) => {
					return obj.asin === amazonID;
				})[0].images[0].large;

				response.send({
					title: product.result[0].title,
					description: product.result[0].description,
					image: image,
				});
			}

			urlMetadata(request.query.url).then(
				function (metadata) {
					response.send(metadata);
				},
				function (error) {
					// failure handler
					response.status(500).send({ error: 'error' });
				}
			);
		} catch (error) {
			console.log(error);
			response.status(500).send({ error: 'error' });
		}
	};
	return module;
};
