import { useToastrState } from '@shared/toastr/context/ToastrContext';
import { ToastrOptions, ToastrStatus } from '@shared/toastr/model/toastr-options.model';
import { ToastrProps } from '@shared/toastr/model/toastr.props';
import { id } from '@utils/functions';

/**
 * Custom hook for displaying toast notifications.
 *
 * This hook returns five methods:
 * - toastr: A generic method to display a toast with provided properties.
 * - info, success, warning, error: Convenience methods that set the toastr status
 *   and then call the generic toastr method.
 *
 * @param delay The duration (in milliseconds) after which the toast should auto-hide.
 *              Default is 5000ms (5 seconds).
 * @returns An object containing methods to trigger different toast notifications.
 *
 * @example
 * const { info, success, warning, error, toastr } = useToastr(10000);
 *
 * // Display an informational toast:
 * info({ title: 'Information', text: 'This is an info message.' });
 */
export const useToastr: (delay: number) => {
	info: (props: ToastrProps) => void;
	success: (props: ToastrProps) => void;
	error: (props: ToastrProps) => void;
	warning: (props: ToastrProps) => void;
	toastr: (props: ToastrProps) => void;
} = (delay = 5000) => {
	// Access the dispatch function from the Toastr context.
	const { dispatch } = useToastrState();

	/**
	 * Displays a toast notification.
	 *
	 * This function generates a unique identifier for the toast, dispatches a
	 * "showToastr" action with the provided properties, and sets up a timeout
	 * to dispatch a "hideToastr" action after the specified delay.
	 *
	 * @param props The properties of the toast notification (title, text, options, etc.).
	 */
	const toastr = (props: ToastrProps) => {
		// Generate a unique ID for the toast.
		const uuid = id();
		// Dispatch the action to show the toast.
		dispatch({
			type: 'showToastr',
			payload: { uuid, toastr: props }
		});

		// Set a timer to automatically hide the toast after the specified delay.
		setTimeout(() => {
			dispatch({ type: 'hideToastr', payload: { uuid } });
		}, delay);
	};

	/**
	 * Convenience method to show an informational toast.
	 *
	 * @param props The toast properties; the 'options' field will be updated to include a status of 'info'.
	 */
	const info = (props: ToastrProps) => {
		// Set the status to 'info'
		const options = setStatus('info', props.options);
		props.options = options;
		// Call the generic toastr function
		toastr(props);
	};

	/**
	 * Convenience method to show a success toast.
	 *
	 * @param props The toast properties; the 'options' field will be updated to include a status of 'success'.
	 */
	const success = (props: ToastrProps) => {
		const options = setStatus('success', props.options);
		props.options = options;
		toastr(props);
	};

	/**
	 * Convenience method to show a warning toast.
	 *
	 * @param props The toast properties; the 'options' field will be updated to include a status of 'warning'.
	 */
	const warning = (props: ToastrProps) => {
		const options = setStatus('warning', props.options);
		props.options = options;
		toastr(props);
	};

	/**
	 * Convenience method to show an error toast.
	 *
	 * @param props The toast properties; the 'options' field will be updated to include a status of 'error'.
	 */
	const error = (props: ToastrProps) => {
		const options = setStatus('error', props.options);
		props.options = options;
		toastr(props);
	};

	/**
	 * Helper function that sets the status property in the Toastr options.
	 *
	 * If no options are provided, it creates a new options object with the given status.
	 * Otherwise, it overrides the existing status.
	 *
	 * @param status The toastr status to set ('info', 'success', 'warning', or 'error').
	 * @param options Optional toastr options provided by the user.
	 * @returns The updated toastr options with the status set.
	 */
	const setStatus = (status: ToastrStatus, options?: ToastrOptions) => {
		// If no options were passed, create a new object with the status.
		if (!options) {
			options = {} as ToastrOptions;
			options.status = status;
			return options;
		}

		// Otherwise, simply set/overwrite the status.
		options.status = status;
		return options;
	};

	// Return the methods that can be used to trigger toast notifications.
	return { info, success, error, warning, toastr };
};
