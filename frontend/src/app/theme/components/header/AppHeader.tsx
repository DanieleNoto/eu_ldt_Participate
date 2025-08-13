import { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import logo from '/images/logo.svg';

const AppHeader = (): JSX.Element => {
	const { t } = useTranslation();

	return (
		<>
			<header
				aria-label="Tool header applicazione"
				className="bg-white min-h-[64px] flex justify-between items-center px-4"
				data-testid="app-header"
			>
				<img src={logo} alt={t('header.logo')} data-testid="app-header-logo" />
				<div className="p-4" data-testid="app-header-user-account"></div>
			</header>
		</>
	);
};

export default AppHeader;
