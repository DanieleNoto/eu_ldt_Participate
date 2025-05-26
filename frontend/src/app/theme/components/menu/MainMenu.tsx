import { NavLink } from 'react-router';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import PlaylistAddOutlinedIcon from '@mui/icons-material/PlaylistAddOutlined';
import { useCallback } from 'react';

const navLinks = [
	{ to: '/dashboard', label: 'Dashboard', icon: <BarChartOutlinedIcon /> },
	{ to: '/simulation', label: 'Simulation', icon: <ScienceOutlinedIcon /> },
	{ to: '/parameters', label: 'Parameters', icon: <PlaylistAddOutlinedIcon /> }
];

const MainMenu = () => {
	const getHoverColor = useCallback((isActive: boolean) => {
		if (isActive) {
			return 'uc:hover:bg-[#ead17b]';
		}
		return 'uc:hover:bg-[#e2e4e6]';
	}, []);

	return (
		<nav aria-label="Main navigation" data-testid="main-menu">
			{navLinks.map((link, index) => (
				<div className="uc:flex uc:flex-col uc:items-center uc:mb-4" key={index}>
					<NavLink
						className={({ isActive }) =>
							`uc:w-12 uc:flex uc:flex-col uc:items-center uc:rounded uc:transition-colors uc:cursor-pointer ${isActive ? 'uc:bg-[#FBE186]' : ''} ${getHoverColor(isActive)} uc:text-[#3F484A] `
						}
						to={link.to}
						aria-label={link.label}
						data-testid={`main-menu-link-${index}`}
					>
						<div className="uc:p-0.5" aria-hidden="true" data-testid={`main-menu-icon-${index}`}>
							{link.icon}
						</div>
						<span className="uc:sr-only">{link.label}</span>
					</NavLink>
					<span className="uc:text-xs uc:pt-1" aria-hidden="true" data-testid={`main-menu-label-${index}`}>
						{link.label}
					</span>
				</div>
			))}
		</nav>
	);
};

export default MainMenu;
