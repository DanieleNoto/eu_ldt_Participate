import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';

const Example = () => {
	const { t } = useTranslation();
	return (
		<>
			<h3>{t('example.title')}</h3>
			<Outlet />
		</>
	);
};
export default Example;
