// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Pierluigi Spedicato
import { useConfig } from '@app/config/ConfigContext';
import { Alert, Snackbar } from '@mui/material';
import { useToastrState } from '@shared/toastr/context/ToastrContext';
import { ToastrProps } from '@shared/toastr/model/toastr.props';
import { JSX } from 'react';

/**
 * ToastrRender component is responsible for rendering toast notifications.
 * It uses the Snackbar and Alert components from Material-UI to display messages.
 * It retrieves the toastr configuration from ConfigContext.
 * It maps over the toastr entries and renders a Snackbar for each toast.
 * NB: autohide snackbar is handled in useToastr hook.
 *
 * @returns {JSX.Element} The rendered component.
 * @component
 * @example
 * <ToastrRender />
 **/
const ToastrRender = (): JSX.Element => {
	const config = useConfig();
	const toastrConfig = config.toastr;
	const { state } = useToastrState();
	const { toastr } = state;
	const tArray = toastr?.entries() ?? [];

	return (
		<>
			{[...tArray].map((toast: [string, ToastrProps]) => (
				<Snackbar
					key={toast[0]}
					open={true}
					onClose={toast[1].onClose}
					anchorOrigin={{
						vertical: toastrConfig.vertical ?? 'top',
						horizontal: toastrConfig.horizontal ?? 'center'
					}}
					sx={{ marginTop: '80px' }}
				>
					<Alert
						onClose={toast[1].onClose}
						severity={toast[1].options?.status}
						sx={{ width: '100%', display: 'flex', alignItems: 'center' }}
					>
						<p className="font-medium text-[16px]">{toast[1].title}</p>
						<p>{toast[1].text}</p>
					</Alert>
				</Snackbar>
			))}
		</>
	);
};

export default ToastrRender;
