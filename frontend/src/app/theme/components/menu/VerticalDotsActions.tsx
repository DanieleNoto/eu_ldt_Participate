import { useRef, useState } from 'react';
import { IconButton } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useTranslation } from 'react-i18next';
import VerticalDotsMenu, { MenuAction } from './VerticalDotsMenu';

interface VerticalDotsActionProps {
	menuAction: MenuAction[];
}

const VerticalDotsAction = (props: VerticalDotsActionProps) => {
	const { menuAction } = props;
	const menuAnchor = useRef<HTMLDivElement | null>(null);
	const [menuOpen, setMenuOpen] = useState<boolean>(false);
	const { t } = useTranslation();

	const handleMenuOpen = () => {
		setMenuOpen(true);
	};

	const handleMenuClose = () => {
		setMenuOpen(false);
	};

	return (
		<div ref={menuAnchor}>
			<IconButton
				onClick={handleMenuOpen}
				aria-label={t('actions.more', { defaultValue: 'Altre azioni' })}
				aria-haspopup="true"
				data-testid="vertical-dots-actions"
			>
				<MoreVertIcon />
			</IconButton>
			<VerticalDotsMenu
				handleMenuClose={handleMenuClose}
				isOpen={menuOpen}
				menuItems={menuAction}
				menuAnchor={menuAnchor && menuAnchor.current}
			/>
		</div>
	);
};

export default VerticalDotsAction;
