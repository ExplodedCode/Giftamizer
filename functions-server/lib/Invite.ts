import fs from 'fs';
import path from 'path';

import handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import { Request, Response } from 'express-serve-static-core';

import { supabase } from './api';

const transporter = nodemailer.createTransport({
	host: '192.168.1.50',
	port: 25,
	secure: false,
});

export async function Internal(request: Request, response: Response) {
	try {
		const group = request.body.group;
		const user = request.body.user;
		const invited_by = request.body.invited_by;

		console.log(`Inviting...`, { user: user, group: group });

		const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.user_id).single();
		if (profile.email_invites) {
			const emailTemplateSource = fs.readFileSync(path.join(__dirname, '../email-templates/internal-invite.html'), 'utf8');
			const template = handlebars.compile(emailTemplateSource);
			const htmlToSend = template({ full_name: `${user.first_name} ${user.last_name}`, invited_by: invited_by, group_name: group.name });

			const info = await transporter.sendMail({
				from: 'noreply@giftamizer.com',
				to: user.email,
				subject: 'Giftamizer Invite',
				html: htmlToSend,
			});
			console.log('Invite sent: %s', info.messageId);
		}

		response.send('ok');
	} catch (error: any) {
		console.error(error.message);
		response.status(500).send(error);
	}
}

export async function External(request: Request, response: Response) {
	try {
		const group = request.body.group;
		const user = request.body.user;
		const invited_by = request.body.invited_by;

		console.log(`Inviting...`, { user: user, group: group });

		const emailTemplateSource = fs.readFileSync(path.join(__dirname, '../email-templates/external-invite.html'), 'utf8');
		const template = handlebars.compile(emailTemplateSource);
		const htmlToSend = template({ invited_by: invited_by, group_name: group.name });

		const info = await transporter.sendMail({
			from: 'noreply@giftamizer.com',
			to: user.email,
			subject: 'Welcome to Giftamizer!',
			html: htmlToSend,
		});
		console.log('Invite sent: %s', info.messageId);

		response.send('ok');
	} catch (error: any) {
		console.error(error.message);
		response.status(500).send(error);
	}
}
