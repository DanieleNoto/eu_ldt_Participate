/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useState } from 'react';

interface ModalContextType {
	modals: Record<string, boolean>;
	selectedValues: Record<string, any>;
	openModal: (name: string) => void;
	closeModal: (name: string) => void;
	selectValue: (name: string, value: any) => void;
}

const ModalContext = createContext<ModalContextType>({
	modals: {},
	selectedValues: {},
	openModal: () => {},
	closeModal: () => {},
	selectValue: () => {}
});

export const ModalProvider = ({ children }: any) => {
	const [modals, setModals] = useState({});
	const [selectedValues, setSelectedValues] = useState({});

	const openModal = (name: any) => {
		setModals(prev => ({ ...prev, [name]: true }));
	};
	const closeModal = (name: any) => setModals(prev => ({ ...prev, [name]: false }));
	const selectValue = (name: any, value: any) => setSelectedValues(prev => ({ ...prev, [name]: value }));

	return (
		<ModalContext.Provider value={{ modals, selectedValues, openModal, closeModal, selectValue }}>
			{children}
		</ModalContext.Provider>
	);
};

// custom hook to use the ModalContext
export const useModal = () => useContext(ModalContext);
