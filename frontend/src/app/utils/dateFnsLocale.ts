import { dateFnsLocales, SupportedDateFnsLocaleCode } from '@config/dateFns.config';

export const resolveDateFnsLocale = (code: SupportedDateFnsLocaleCode) => dateFnsLocales[code];
