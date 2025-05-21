import { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import logo from '/images/logo.svg';

const AppHeader = (): JSX.Element => {
	const { t } = useTranslation();
	return (
		<header className="uc:bg-white uc:min-h-[64px] uc:flex uc:px-4">
			<img src={logo} alt={t('header.logo')} />
		</header>
	);
};

export default AppHeader;
