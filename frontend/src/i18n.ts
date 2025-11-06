import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import commonEn from './config/locales/en.json';
import commonEs from './config/locales/es.json';

export const defaultNS = 'common';
export const resources = {
	en: {
		common: commonEn
	},
	es: {
		common: commonEs
	}
} as const;

i18n.use(initReactI18next).init({
	lng: 'en',
	ns: ['common'],
	defaultNS,
	resources,
	fallbackLng: 'en',
	interpolation: {
		escapeValue: false // react already safes from xss
	}
});

export default i18n;
