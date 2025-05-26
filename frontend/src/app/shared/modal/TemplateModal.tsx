import { Box, Modal, Typography } from '@mui/material';
import TemplateModalProps from './models/TemplateModalProps';
import { useModal } from './ModalContext';
import DefaultActionsFooter from './components/DefaultActionsFooter';

const TemplateModal = ({
	id,
	title,
	titleIcon,
	defaultAction,
	size,
	children,
	onClose,
	onConfirm
}: TemplateModalProps) => {
	const { modals } = useModal();
	const getModalWidth = () => {
		switch (size) {
			case 'xs':
				return '300px';
			case 'sm':
				return '400px';
			case 'md':
				return '500px';
			case 'lg':
				return '600px';
			case 'xl':
				return '700px';
			case '2xl':
				return '900px';
			default:
				return 'fit-content';
		}
	};
	return (
		<Modal open={modals[id] || false} onClose={onClose}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'flex-start',
					p: 3,
					backgroundColor: 'white',
					margin: 'auto',
					mt: 10,
					width: getModalWidth(),
					borderRadius: 2,
					outline: 'none'
				}}
			>
				{titleIcon ? (
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
						{titleIcon}
						<Typography sx={{ fontSize: 20, fontWeight: 700, width: '100%' }}>{title}</Typography>
					</Box>
				) : (
					<Typography sx={{ fontSize: 20, fontWeight: 700, width: '100%', pb: 1 }}>{title}</Typography>
				)}
				<Box sx={{ pb: 1, width: '100%' }}>{children}</Box>
				{defaultAction && <DefaultActionsFooter onClose={onClose} onConfirm={onConfirm} />}
			</Box>
		</Modal>
	);
};

export default TemplateModal;
