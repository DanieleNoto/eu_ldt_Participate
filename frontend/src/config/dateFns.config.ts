import { it } from 'date-fns/locale';

// Keep runtime locale registry separate from serializable config
export const dateFnsLocales = {
	it
};

export type SupportedDateFnsLocaleCode = keyof typeof dateFnsLocales;

export interface DateFnsConfig {
	format: string;
	locale: SupportedDateFnsLocaleCode; // store only the code in Redux
}

export const dateFnsConfig: DateFnsConfig = {
	format: 'dd/MM/yyyy',
	locale: 'it'
};
