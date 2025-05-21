import { RUNTIME_APP_CONFIG } from '@app/App.config';
import { Alert, Snackbar } from '@mui/material';
import { useToastrState } from '@shared/toastr/context/ToastrContext';
import { ToastrProps } from '@shared/toastr/model/toastr.props';
import { JSX } from 'react';

const ToastrRender = (): JSX.Element => {
	const { state } = useToastrState();
	const { toastr } = state;
	const tArray = toastr?.entries() || [];

	return (
		<>
			{[...tArray].map((toast: [string, ToastrProps]) => (
				<Snackbar
					key={toast[0]}
					open={true}
					autoHideDuration={RUNTIME_APP_CONFIG.toastr.delay}
					onClose={toast[1].onClose}
				>
					<Alert
						onClose={toast[1].onClose}
						severity={toast[1].options?.status}
						variant="filled"
						sx={{ width: '100%' }}
					>
						{toast[1].title}
						<p>{toast[1].text}</p>
					</Alert>
				</Snackbar>
			))}
		</>
	);
};

export default ToastrRender;
