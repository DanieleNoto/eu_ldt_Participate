/* eslint-disable @typescript-eslint/no-explicit-any */
import { ToastrProps } from '@shared/toastr/model/toastr.props';
import { createContext, Dispatch, JSX, ReactNode, useContext, useReducer } from 'react';

/**
 * The Toastr actions type
 */
type ToastrActionType = 'showToastr' | 'hideToastr';

/**
 * State of Toastr context
 */
interface ToastrState {
	toastr: Map<string, ToastrProps>;
}

/**
 * Generic type for action (maybe useful externalize this for shared use)
 */
interface Action<T> {
	type: T;
	payload?: any;
}

/**
 * Toastr context
 */
interface ToastrContext {
	state: Partial<ToastrState>;
	dispatch: Dispatch<Action<ToastrActionType>>;
}

// initial state
const initialState: ToastrState = {
	toastr: new Map<string, ToastrProps>()
};

const ToastrContext = createContext<ToastrContext | undefined>(undefined);

const ToastrReducer: (state: ToastrState, action: Action<ToastrActionType>) => ToastrState = (
	state: ToastrState,
	action: Action<ToastrActionType>
) => {
	switch (action.type) {
		case 'showToastr': {
			const newToasts = new Map(state.toastr);
			newToasts.set(action.payload.uuid, action.payload.toastr);
			return {
				...state,
				toastr: newToasts
			};
		}
		case 'hideToastr': {
			const newToasts = new Map(state.toastr);
			newToasts.delete(action.payload.uuid);
			return {
				...state,
				toastr: newToasts
			};
		}
		default: {
			throw new Error('unhandled action');
		}
	}
};

const ToastrProvider: ({ children }: { children: ReactNode }) => JSX.Element = ({
	children
}: {
	children: ReactNode;
}) => {
	const [state, dispatch] = useReducer(ToastrReducer, initialState);

	const value = { state, dispatch };
	return <ToastrContext.Provider value={value}>{children}</ToastrContext.Provider>;
};

/**
 * Custom hook for use context
 * @returns {UIContext} Toastr context
 */
const useToastrState = () => {
	const context = useContext(ToastrContext);
	if (context === undefined) {
		throw new Error('useToastrState must be used within a ToastrProvider');
	}
	return context;
};

export { ToastrProvider, useToastrState };
