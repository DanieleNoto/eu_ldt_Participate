import { useTranslation } from 'react-i18next';
import logo from '/images/tool-logo.svg';

const ToolHeader = () => {
	const { t } = useTranslation();
	return (
		<header
			aria-label="Tool header applicazione"
			className="uc:min-h-[48px] uc:flex uc:px-4 uc:p-2 uc:items-center uc:justify-between"
		>
			<div className="uc:flex uc:gap-4">
				<img src={logo} alt={t('header.toollogo')} className="uc:mr-3" />
			</div>
			{/* <Button variant="text">
				<AppsIcon></AppsIcon>
				{t('header.toollink')}
			</Button> */}
		</header>
	);
};

export default ToolHeader;
