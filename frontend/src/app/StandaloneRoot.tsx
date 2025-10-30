import { BrowserRouter } from 'react-router';
import App from './App';

const StandaloneRoot = () => {
	return (
		<BrowserRouter>
			<App />
		</BrowserRouter>
	);
};
export default StandaloneRoot;
