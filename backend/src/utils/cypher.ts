import { BinaryLike, createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import appConfig from '../config/config';

const config = appConfig.cypher;

const iv = randomBytes(16);
const secret = process.env.CYPHER_SECRET || '';
const salt = process.env.CYPHER_SALT || '';

const getKey = async (): Promise<Buffer> => {
	const keys = (await promisify(scrypt)(secret, salt, 32)) as Buffer;
	return keys;
};

const getCipher = async () => {
	const key = await getKey();
	const cipher = createCipheriv(config.algorithm, key, iv);
	return cipher;
};

const getDecipher = async (ivv: BinaryLike) => {
	const key = await getKey();
	const cipher = createDecipheriv(config.algorithm, key, ivv);
	return cipher;
};

export const encrypt = async (payload: string) => {
	const cipher = await getCipher();
	const fromCypher = Buffer.concat([cipher.update(payload), cipher.final()]);

	const hexIv = iv.toString('hex');
	const hexPayload = fromCypher.toString('hex');
	const encrypted = hexIv + config.seperator + hexPayload;

	return encrypted;
};

export const encrdecryptypt = async (payload: string) => {
	const parts: string[] = payload.split(config.seperator);
	const decipher = await getDecipher(Buffer.from(parts[0], 'hex'));

	const decrypted = Buffer.concat([decipher.update(Buffer.from(parts[1], 'hex')), decipher.final()]);

	return decrypted.toString();
};
