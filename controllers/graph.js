const axios = require('axios');

module.exports = {
	getToken: async function () {
		const params = new URLSearchParams();
		params.append('grant_type', 'client_credentials');
		params.append('client_id', process.env.EMAIL_CLIENT_ID);
		params.append('client_secret', process.env.EMAIL_CLIENT_SECRET);
		params.append('resource', 'https://graph.microsoft.com');
		const res = await axios.post(`https://login.microsoftonline.com/${process.env.EMAIL_TENANT_ID}/oauth2/token`, params);
		return res.data.access_token;
	},

	sendEmail: async function (token, to, subject, body) {
		console.log(to, subject);

		return axios
			.post(
				'https://graph.microsoft.com/v1.0/users/' + process.env.EMAIL_FROM_USER + '/sendMail',
				{
					message: {
						from: {
							emailAddress: {
								name: 'Giftamizer',
								address: process.env.EMAIL_FROM_EMAIL,
							},
						},
						subject: subject,
						body: {
							contentType: 'HTML',
							content: body,
						},
						toRecipients: [
							{
								emailAddress: {
									address: to,
								},
							},
						],
					},
					saveToSentItems: 'true',
				},
				{
					headers: { Authorization: 'Bearer '.concat(token) },
					'Content-Type': 'application/json',
				}
			)
			.then((response) => {
				return response;
			})
			.catch((error) => {
				return error;
			});
	},
};
