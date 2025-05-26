export default interface GenericMessage {
	code?: string;
	message: string;
	cause?: unknown;
	data?: unknown;
}
