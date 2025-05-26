import { BrowserRouter } from 'react-router';
import App from './App';

const StandaloneRoot = () => {
	return (
		<BrowserRouter>
			<App standalone={true} />
		</BrowserRouter>
	);
};
export default StandaloneRoot;
