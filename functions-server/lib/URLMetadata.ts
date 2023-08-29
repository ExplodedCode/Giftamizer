import axios from 'axios';
import { Request, Response } from 'express-serve-static-core';

const urlMetadata = require('./metadata');

export async function URLMetadata(request: Request, response: Response) {
	try {
		urlMetadata(request.body.url).then(
			async (metadata: any) => {
				let data = {
					name: metadata.title ?? metadata['og:title'] ?? metadata['twitter:title'] ?? '',
					description: metadata.description ?? metadata['og:description'] ?? metadata['twitter:description'] ?? '',
					image: metadata.image ?? metadata['og:image'] ?? metadata['twitter:image'],
				};

				if (data.image?.startsWith('/') && !data.image?.startsWith('//')) {
					data.image = request.body.url.split('/')[0] + '//' + request.body.url.split('/')[2] + data.image;
				}

				try {
					if (data.image !== null) {
						data.image = await getImageAsBase64(data.image);
					}
					response.send(data);
				} catch (error: any) {
					console.error('getImageAsBase64', error);
					response.status(500).send(error.message);
				}
			},
			(error: any) => {
				console.error('urlMetadata', error);
				response.status(500).send(error.message);
			}
		);
	} catch (error: any) {
		console.error('try', error);
		response.status(500).send(error.message);
	}
}

async function getImageAsBase64(imageUrl: string): Promise<string> {
	const response = await axios.get(imageUrl, {
		responseType: 'arraybuffer',
	});

	return new Promise((resolve, reject) => {
		resolve(`data:${response.headers['content-type']};base64,${Buffer.from(response.data, 'binary').toString('base64')}`);
	});
}
