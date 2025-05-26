import { Locale } from 'date-fns';
import { it } from 'date-fns/locale';

export interface DateFnsConfig {
	format: string;
	parseOptions: { locale: Locale };
	formatOptions: { locale: Locale };
	getWeekOptions: unknown;
}

export const dateFnsConfig: DateFnsConfig = {
	format: 'dd/MM/yyyy',
	parseOptions: { locale: it },
	formatOptions: { locale: it },
	getWeekOptions: {}
};
