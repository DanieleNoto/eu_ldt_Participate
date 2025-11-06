import { createContext, useContext, ReactNode } from 'react';
import { ConfigState } from '@app/store/config/config-slice';

const ConfigContext = createContext<ConfigState | undefined>(undefined);

export const ConfigProvider = ({ config, children }: { config: ConfigState; children: ReactNode }) => {
	return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
};

export const useConfig = () => {
	const config = useContext(ConfigContext);
	if (!config) {
		throw new Error('useConfig must be used within ConfigProvider');
	}
	return config;
};
