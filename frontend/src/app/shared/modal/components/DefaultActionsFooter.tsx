import { Button } from '@mui/material';

const DefaultActionsFooter = ({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) => {
	return (
		<div className="uc:flex uc:justify-end uc:gap-2 uc:w-full">
			<Button variant="outlined" data-modal-action="cancel" data-testid="cancel-button" onClick={onClose}>
				Cancel
			</Button>
			<Button variant="contained" data-modal-action="confirm" data-testid="confirm-button" onClick={onConfirm}>
				Confirm
			</Button>
		</div>
	);
};

export default DefaultActionsFooter;
