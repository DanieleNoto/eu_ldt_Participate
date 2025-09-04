/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, Dispatch, ReactNode, useContext, useReducer } from 'react';

/**
 * UI state manager based on native react context
 * @link Inspired by https://kentcdodds.com/blog/how-to-use-react-context-effectively
 * @link Inspired by https://robinvdvleuten.nl/blog/how-to-use-react-context/
 */

/**
 * The UI actions type
 */
type UIActionType = 'setOpenMenu' | 'setLoading';

/**
 * State of UI context
 */
interface UIState {
	menuOpen: boolean;
	loading: boolean;
}

/**
 * Generic type for action (maybe useful externalize this for shared use)
 */
interface Action<T> {
	type: T;
	payload?: any;
}

/**
 * UI context
 */
interface UIContext {
	state: Partial<UIState>;
	dispatch: Dispatch<Action<UIActionType>>;
}

// initial state
const initialState: UIState = {
	menuOpen: false,
	loading: false
};

// ui context
const UIContext = createContext<UIContext>({} as UIContext);

/**
 * Define the reducer the UI state
 * @param _state
 * @param action
 * @returns return the new state
 */
const UIReducer = (state: UIState, action: Action<UIActionType>) => {
	switch (action.type) {
		case 'setOpenMenu': {
			return { ...state, menuOpen: action.payload };
		}
		case 'setLoading': {
			return { ...state, loading: action.payload };
		}
		default: {
			throw new Error(`Unhandled action type: ${action.type}`);
		}
	}
};

/**
 * Provider of context
 * @param {Object} params
 * @param {ReactNode} params.children
 * @returns {JSX.Element} react element
 */
const UIProvider = ({ children }: { children: ReactNode }) => {
	const [state, dispatch] = useReducer(UIReducer, initialState);
	// NOTE: you *might* need to memoize this value
	// Learn more in http://kcd.im/optimize-context
	const value = { state, dispatch };
	return (
		<UIContext.Provider value={value}>
		</UIContext.Provider>
	);
};

/**
 * Custom hook for use context
 * @returns {UIContext} UI context
 */
const useUIState = () => {
	const context = useContext(UIContext);
	if (context === undefined) {
		throw new Error('useCount must be used within a CountProvider');
	}
	return context;
};

export { UIProvider, useUIState };
