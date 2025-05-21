import AppsIcon from '@mui/icons-material/Apps';
import { Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import logo from '/images/tool-logo.svg';

const ToolHeader = () => {
	const { t } = useTranslation();

	return (
		<header className="uc:min-h-[64px] uc:flex uc:px-4 uc:p-4 uc:items-center uc:justify-between">
			<img src={logo} alt={t('header.toollogo')} />
			<Button variant="text">
				<AppsIcon></AppsIcon>
				{t('header.toollink')}
			</Button>
		</header>
	);
};

export default ToolHeader;
