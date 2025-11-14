import nodemailer from 'nodemailer';
import { FastifyReply, FastifyRequest } from 'fastify';
import { SupportRequestSchema, SupportResponseSchema } from '../schemas/chat.schema';
import logger from '../utils/logger';

interface SmtpAuth {
	user: string;
	pass: string;
}

class SupportController {
	async send(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { conversationId, message } = SupportRequestSchema.parse(request.body);

			const auth: SmtpAuth | undefined = process.env.SMTP_USER_NAME
				? { user: process.env.SMTP_USER_NAME as string, pass: process.env.SMTP_PASSWORD as string }
				: undefined;

			logger.info({
				msg: 'SMTP Configuration',
				config: {
					host: process.env.SMTP_ADDRESS || 'NOT_SET',
					port: process.env.SMTP_PORT || 'NOT_SET',
					secure: Number(process.env.SMTP_PORT) === 465,
					user: process.env.SMTP_USER_NAME || 'NOT_SET',
					hasPassword: !!process.env.SMTP_PASSWORD
				}
			});

			const transporter = nodemailer.createTransport({
				host: process.env.SMTP_ADDRESS || 'localhost',
				port: Number(process.env.SMTP_PORT) || 25,
				secure: Number(process.env.SMTP_PORT) === 465,
				auth,
				tls: {
					rejectUnauthorized: process.env.NODE_ENV === 'production'
				}
			});

			// Test the connection
			try {
				await transporter.verify();
				logger.info({ msg: 'SMTP connection verified successfully' });
			} catch (smtpError) {
				logger.error({
					msg: 'SMTP connection failed',
					error: smtpError instanceof Error ? smtpError.message : smtpError
				});
				throw smtpError;
			}

			const to = process.env.CHATBOT_SUPPORT_EMAIL || 'support@example.com';
			const from = process.env.CHATBOT_FROM_EMAIL || 'no-reply@example.com';

			logger.info({
				msg: 'Sending email',
				emailInfo: { from, to, subject: `[Chatbot Support] Conversation ${conversationId}` }
			});

			const info = await transporter.sendMail({
				from,
				to,
				subject: `[Chatbot Support] Conversation ${conversationId}`,
				text: message
			});

			logger.info({
				msg: 'Email sent successfully',
				info: { messageId: info.messageId, response: info.response }
			});

			const response = { response: 'sent' };
			SupportResponseSchema.parse(response);
			return reply.send(response);
		} catch (error) {
			logger.error({ msg: 'Support controller error', error });

			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			const errorStack = error instanceof Error ? error.stack : undefined;

			logger.error({
				msg: 'Email sending failed',
				error: errorMessage,
				stack: errorStack,
				errorType: error instanceof Error ? error.constructor.name : typeof error
			});

			return reply.status(500).send({ error: 'Failed to send email', details: errorMessage });
		}
	}
}

export default new SupportController();
