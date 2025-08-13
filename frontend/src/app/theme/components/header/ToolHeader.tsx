import { useTranslation } from 'react-i18next';
import logo from '/images/tool-logo.svg';

const ToolHeader = () => {
	const { t } = useTranslation();
	return (
		<header
			aria-label="Tool header applicazione"
			className="min-h-[48px] flex px-4 p-2 items-center justify-between"
		>
			<div className="flex gap-4">
				<img src={logo} alt={t('header.toollogo')} className="mr-3" />
			</div>
			{/* <Button variant="text">
				<AppsIcon></AppsIcon>
				{t('header.toollink')}
			</Button> */}
		</header>
	);
};

export default ToolHeader;
