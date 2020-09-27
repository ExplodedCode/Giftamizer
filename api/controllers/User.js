module.exports = function (giftConnection, db) {
	var module = {};

	module.create = async (request, response) => {
		try {
			// request params & varables
			var customer = request.query.customer || '';
			var name = request.query.name || '';

			giftConnection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
				if (error) throw error;
				console.log('The solution is: ', results[0].solution);

				var output = { result: null, count: 0 };
				output.result = JSON.parse(
					JSON.stringify(results[0].solution)
						.replace(/"\s+|\s+"/g, '"')
						.replace(/ /g, ' ')
				); // remove blank spaces for optimization
				// output.count = result.recordsets[1][0].count;
				response.send(output);
			});
		} catch (error) {
			console.error(error.message);
			response.status(500).send(error);
		}
	};
	return module;
};
