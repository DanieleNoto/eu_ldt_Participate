import { ListItemIcon, ListItemText, Menu, MenuItem, MenuList } from '@mui/material';

export interface MenuAction {
	label: string;
	action: (param: any) => void;
	icon?: React.ReactNode;
	dataTestId?: string;
}

interface VerticalDotsMenuProps {
	menuAnchor: HTMLDivElement | null;
	handleMenuClose: () => void;
	isOpen: boolean;
	menuItems: MenuAction[];
}

const VerticalDotsMenu = (props: VerticalDotsMenuProps) => {
	const { menuAnchor, handleMenuClose, isOpen, menuItems } = props;

	const handleItemAction = (item: MenuAction) => {
		item.action(item);
		handleMenuClose();
	};

	return (
		<>
			<Menu
				id="basic-menu"
				data-testid="vertical-dots-actions-menu"
				anchorEl={menuAnchor}
				open={isOpen}
				onClose={handleMenuClose}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				MenuListProps={{
					'aria-labelledby': 'basic-button'
				}}
				sx={{
					'& .MuiPaper-root': {
						borderRadius: '4px',
						backgroundColor: '#FCFCFC',
						boxShadow: '0px 1px 4px 0px rgba(0, 0, 0, 0.25)',
						minWidth: 180
					}
				}}
			>
				<MenuList sx={{ padding: 0 }}>
					{menuItems.map((item, index) => (
						<MenuItem key={index} onClick={() => handleItemAction(item)} data-testid={item?.dataTestId}>
							{item.icon && <ListItemIcon sx={{ color: 'black' }}>{item.icon}</ListItemIcon>}
							<ListItemText>{item.label}</ListItemText>
						</MenuItem>
					))}
				</MenuList>
			</Menu>
		</>
	);
};

export default VerticalDotsMenu;
