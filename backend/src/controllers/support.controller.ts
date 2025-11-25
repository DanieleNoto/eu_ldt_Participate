// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
import nodemailer, { Transporter } from 'nodemailer';
import { FastifyReply, FastifyRequest } from 'fastify';
import { SupportRequestSchema, SupportResponseSchema } from '../schemas/chat.schema';
import logger from '../utils/logger';

interface SmtpAuth {
	user: string;
	pass: string;
}

interface EmailConfig {
	to: string;
	from: string;
	primaryColor: string;
	organizationName: string;
	organizationUrl: string;
	logoUrl: string;
}

interface LegalNotices {
	[key: string]: string;
}

const LEGAL_NOTICES: LegalNotices = {
	en: 'This email was sent from a notification email address that cannot accept incoming email. Please do not reply to this message.',
	es: 'Este correo electrónico se envió desde una dirección de correo electrónico de notificación que no puede aceptar correo electrónico entrante. No responda a este mensaje.',
	fr: "Cet e-mail a été envoyé à partir d'une adresse e-mail de notification qui ne peut pas accepter les e-mails entrants. Veuillez ne pas répondre à ce message.",
	de: 'Diese E-Mail wurde von einer Benachrichtigungs-E-Mail-Adresse gesendet, die keine eingehenden E-Mails akzeptieren kann. Bitte antworten Sie nicht auf diese Nachricht.'
};

class SupportController {
	async send(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { conversationId, message } = SupportRequestSchema.parse(request.body);
			const language = (request.body as any).language ?? 'en';

			const transporter = this._createTransporter();
			await this._verifySmtpConnection(transporter);

			const config = this._getEmailConfig();
			const legalNotice = this._getLegalNotice(language);

			logger.info({
				msg: 'Sending email',
				emailInfo: {
					from: config.from,
					to: config.to,
					subject: `[Chatbot Support] Conversation ${conversationId}`
				}
			});

			const htmlContent = this._buildHtmlContent(config, conversationId, message, legalNotice);

			const info = await transporter.sendMail({
				from: config.from,
				to: config.to,
				subject: `[Chatbot Support] Conversation ${conversationId}`,
				text: message,
				html: htmlContent
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

	private _getSmtpAuth(): SmtpAuth | undefined {
		return process.env.SMTP_USER_NAME
			? {
					user: process.env.SMTP_USER_NAME,
					pass: process.env.SMTP_PASSWORD as string
				}
			: undefined;
	}

	private _createTransporter(): Transporter {
		const auth = this._getSmtpAuth();

		logger.info({
			msg: 'SMTP Configuration',
			config: {
				host: process.env.SMTP_ADDRESS ?? 'NOT_SET',
				port: process.env.SMTP_PORT ?? 'NOT_SET',
				secure: Number(process.env.SMTP_PORT) === 465,
				user: process.env.SMTP_USER_NAME ?? 'NOT_SET',
				hasPassword: !!process.env.SMTP_PASSWORD
			}
		});

		return nodemailer.createTransport({
			host: process.env.SMTP_ADDRESS ?? 'localhost',
			port: Number(process.env.SMTP_PORT) || 25,
			secure: Number(process.env.SMTP_PORT) === 465,
			auth,
			tls: {
				rejectUnauthorized: process.env.NODE_ENV === 'production'
			}
		});
	}

	private async _verifySmtpConnection(transporter: Transporter): Promise<void> {
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
	}

	private _getEmailConfig(): EmailConfig {
		const organizationUrl = process.env.DECIDIM_HOST
			? `https://${process.env.DECIDIM_HOST}`
			: 'https://participate.example.com';

		return {
			to: process.env.CHATBOT_SUPPORT_EMAIL ?? 'support@example.com',
			from: process.env.CHATBOT_FROM_EMAIL ?? 'no-reply@example.com',
			primaryColor: process.env.DECIDIM_PRIMARY_COLOR ?? '#004494',
			organizationName: process.env.DECIDIM_ORGANIZATION_NAME ?? 'EU LDT Participate Tool',
			organizationUrl,
			logoUrl: process.env.DECIDIM_LOGO_URL ?? `${organizationUrl}/media/images/logo-white.svg`
		};
	}

	private _getLegalNotice(language: string): string {
		return LEGAL_NOTICES[language] ?? LEGAL_NOTICES.en;
	}

	private _buildHtmlContent(
		config: EmailConfig,
		conversationId: string,
		message: string,
		legalNotice: string
	): string {
		const { primaryColor, organizationName, organizationUrl, logoUrl } = config;

		return `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<style type="text/css">
		body {
			margin: 0;
			padding: 0;
			font-family: Helvetica, Arial, sans-serif;
			background-color: #f3f3f3;
			color: #0a0a0a;
			font-size: 16px;
			line-height: 1.5;
		}
		.email-container {
			max-width: 600px;
			margin: 20px auto;
			background-color: #ffffff;
		}
		.header {
			background-color: ${primaryColor};
			padding: 24px 32px;
			text-align: center;
		}
		.header img {
			height: 32px;
			max-height: 32px;
			width: auto;
			display: block;
			margin: 0 auto;
		}
		.content {
			padding: 32px 64px;
			background-color: #ffffff;
		}
		.content p {
			margin: 0 0 16px 0;
		}
		.footer {
			background-color: ${primaryColor};
			padding: 24px 32px;
			text-align: right;
		}
		.footer a {
			color: #ffffff !important;
			text-decoration: none;
			font-size: 14px;
		}
		.legal-notice {
			padding: 16px 32px;
			text-align: center;
			font-size: 12px;
			color: #666666;
			background-color: #f3f3f3;
		}
		@media only screen and (max-width: 600px) {
			.content {
				padding: 24px 32px;
			}
		}
	</style>
</head>
<body>
	<div class="email-container">
		<div class="header">
			<img src="${logoUrl}" alt="${organizationName}" height="32">
		</div>
		<div class="content">
			<p><strong>Conversation ID:</strong> ${conversationId}</p>
			<p>${message.replaceAll('\n', '<br>')}</p>
		</div>
		<div class="footer">
			<a href="${organizationUrl}">${organizationName}</a>
		</div>
		<div class="legal-notice">
			${legalNotice}
		</div>
	</div>
</body>
</html>`;
	}
}

export default new SupportController();
