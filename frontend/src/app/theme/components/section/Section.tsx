import { useAppSelector } from '@app/store/hook';
import { selectSection } from '@app/store/main/main-slice.selectors';
import { Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CreateOutlinedIcon from '@mui/icons-material/CreateOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import { JSX } from 'react';
import VerticalDotsAction from '../menu/VerticalDotsActions';
import { SectionModel } from './section.model';

const iconMap: Record<string, JSX.Element> = {
	edit: <CreateOutlinedIcon />,
	export: <FileUploadOutlinedIcon />
};

const Section = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const section = useAppSelector(selectSection) as SectionModel;

	const sectionActions =
		section?.actions?.map(action => ({
			label: t(action.label),
			action: () => {
				window.dispatchEvent(new CustomEvent('section-action', { detail: action.actionType }));
			},
			icon: action.iconType ? iconMap[action.iconType] : <CreateOutlinedIcon />,
			dataTestId: action.dataTestId ?? ''
		})) ?? [];

	return (
		section && (
			<>
				<div className="flex justify-between px-6 my-4 items-center text-[#2F3538]">
					<div className="flex gap-4 items-center">
						<ArrowBackIcon
							onClick={() => navigate(section.parentLink ?? '')}
							sx={{ fontSize: 24, cursor: 'pointer', color: '#171D1E' }}
						/>
						<div className="text-[22px] font-semibold">{t(section.sectionTitle || '')} </div>
					</div>
					{sectionActions.length > 0 && <VerticalDotsAction menuAction={sectionActions} />}
				</div>
				<Divider variant="middle" />
			</>
		)
	);
};
export default Section;
