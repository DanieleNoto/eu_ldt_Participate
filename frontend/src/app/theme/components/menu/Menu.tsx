import { useUIState } from '@theme/context/UI';
import { useEffect } from 'react';
import { useLocation } from 'react-router';

interface Props {
	menuId: string;
}

const Menu = ({ menuId }: Props) => {
	// const { t } = useTranslation();
	// const menuItem: MenuItem[] = getMenuItems();
	const { dispatch } = useUIState();

	const location = useLocation();

	console.log(menuId);

	useEffect(() => {
		dispatch({ type: 'setOpenMenu', payload: false });
	}, [location]);

	return (
		<nav className="uc:flex-1 uc:px-4 uc:py-6 uc:overflow-y-auto uc:bg-[#F6F8FA] uc:text-[#3F484A] uc:rounded-xl">
			{/* TODO [HIGH][20250212][piespedica]: Use real menu. */}
			<ul className="space-y-2">
				<li>
					<a
						href="#"
						className="uc:block uc:px-2 uc:py-2 uc:rounded uc:hover:bg-[#F6F8FA] uc:transition-colors"
					>
						Dashboard
					</a>
				</li>
				<li>
					<a
						href="#"
						className="uc:block uc:px-2 uc:py-2 uc:rounded uc:hover:bg-[#F6F8FA] uc:transition-colors"
					>
						Use Cases &amp; Scenarios
					</a>
				</li>
			</ul>
		</nav>
	);
};

// const getActiveProps = () => {
// 	return {
// 		style: {
// 			fontWeight: 'bold'
// 		}
// 	};
// };

export default Menu;
