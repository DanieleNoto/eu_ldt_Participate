import nodemailer from 'nodemailer';
import { FastifyReply, FastifyRequest } from 'fastify';
import { SupportRequestSchema, SupportResponseSchema } from '../schemas/chat.schema';
import { BaseController } from './base/base.controller';

interface SmtpAuth {
	user: string;
	pass: string;
}

class SupportController extends BaseController {
	async send(request: FastifyRequest, reply: FastifyReply) {
		const { conversationId, message } = SupportRequestSchema.parse(request.body);

		const auth: SmtpAuth | undefined = process.env.SMTP_USER
			? { user: process.env.SMTP_USER as string, pass: process.env.SMTP_PASS as string }
			: undefined;

		const transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST || 'localhost',
			port: Number(process.env.SMTP_PORT) || 25,
			secure: false,
			auth
		});

		const to = process.env.SUPPORT_EMAIL || 'support@example.com';
		const from = process.env.FROM_EMAIL || 'no-reply@example.com';

		await transporter.sendMail({
			from,
			to,
			subject: `[Chatbot Support] Conversation ${conversationId}`,
			text: message
		});

		const response = { response: 'sent' };
		SupportResponseSchema.parse(response);
		return reply.send(response);
	}
}

export default new SupportController();
