const urlMetadata = require('url-metadata');

const amazonScraper = require('amazon-buddy');
const amazonAsin = require('amazon-asin');

module.exports = function (e, db) {
	var module = {};

	//  /api/syncUsers/:location/:tenant/:group
	module.get = async (request, response, next) => {
		try {
			var amazonID = amazonAsin.syncParseAsin(request.query.url).ASIN;

			console.log(request.query.url, amazonID);

			if (amazonID) {
				const product = await amazonScraper.asin({ asin: amazonID });

				var image;
				try {
					image = product.result[0].variants.filter((obj) => {
						return obj.asin === amazonID;
					})[0].images[0].large;
				} catch (error) {
					image = product.result[0].main_image;
				}

				response.send({
					title: product.result[0].title,
					description: product.result[0].description,
					image: image,
				});
			} else {
				urlMetadata(request.query.url).then(
					function (metadata) {
						console.log(metadata);
						response.send(metadata);
					},
					function (error) {
						// failure handler
						console.log(error);
						response.status(500).send({ error: 'error' });
					}
				);
			}
		} catch (error) {
			console.log(error);
			response.status(500).send({ error: 'error' });
		}
	};
	return module;
};
