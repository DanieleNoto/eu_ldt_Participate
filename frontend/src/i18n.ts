import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import common from './config/locales/it/common.json';

export const defaultNS = 'common';
export const resources = {
	it: {
		common
	}
} as const;

i18n.use(initReactI18next).init({
	lng: 'it',
	ns: ['common'],
	defaultNS,
	resources,
	fallbackLng: 'it',
	interpolation: {
		escapeValue: false // react already safes from xss
	}
});

export default i18n;
