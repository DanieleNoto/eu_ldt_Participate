import { useAppDispatch } from '@app/store/hook';
import { setAppMenuItems, setSection } from '@app/store/main/main-slice';
import { Container } from '@mui/material';
import { useEffect } from 'react';
import { getMenuItems } from '../Pages.menu';
import CardExample from './components/CardExample';

const Dashboard = () => {
	const dispatchAppState = useAppDispatch();
	useEffect(() => {
		dispatchAppState(setSection(null)); // reset section title state
		dispatchAppState(setAppMenuItems(getMenuItems())); // reset menu items state

		// adding dispatchAppState to the dependency array may cause problems
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<Container style={{ textAlign: 'center', marginTop: '50px' }}>
			<div className="uc:grid uc:grid-cols-1 uc:gap-6 uc:xl:grid-cols-3">
				<CardExample />
			</div>
		</Container>
	);
};

export default Dashboard;
