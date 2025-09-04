import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SimplifiedMainProvider from '@app/SimplifiedMainProvider';
import Chatbot from './Chatbot';
import '@src/i18n';
import '@theme/styles/global.css';

interface ChatbotWebComponentProps {
	language?: string;
	onSupportSent?: () => void;
	className?: string;
}

const ChatbotWebComponent: React.FC<ChatbotWebComponentProps> = ({ 
	language = 'en', 
	onSupportSent, 
	className 
}) => {
	const [configLoaded, setConfigLoaded] = useState(false);
	const { i18n } = useTranslation();

	useEffect(() => {
		// Change i18n language when language prop changes
		if (i18n.language !== language) {
			i18n.changeLanguage(language);
		}
	}, [language, i18n]);

	useEffect(() => {
		// Load config if not already loaded
		fetch('/config/config.json')
			.then(response => response.json())
			.then(() => {
				// Store config globally if needed
				setConfigLoaded(true);
			})
			.catch(error => {
				// eslint-disable-next-line no-console
				console.warn('Failed to load config.json, using defaults:', error);
				setConfigLoaded(true);
			});
	}, []);

	if (!configLoaded) {
		return <div>Loading...</div>;
	}

	return (
		<SimplifiedMainProvider>
			<div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}>
				<Chatbot 
					language={language}
					onSupportSent={onSupportSent}
					className={className}
				/>
			</div>
		</SimplifiedMainProvider>
	);
};

export default ChatbotWebComponent;
