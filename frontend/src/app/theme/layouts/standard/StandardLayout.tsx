import AppHeader from '@app/theme/components/header/AppHeader';
import ToolHeader from '@app/theme/components/header/ToolHeader';
import Menu from '@app/theme/components/menu/Menu';
import { ReactNode } from 'react';

interface StandardLayoutProps {
	children?: ReactNode;
	standalone: boolean;
}

export const StandardLayout = ({ children, standalone = false }: StandardLayoutProps) => {
	return (
		<div className="uc:max-h-screen uc:bg-gray-100">
			{standalone && (
				<>
					<AppHeader></AppHeader>
					<ToolHeader></ToolHeader>
				</>
			)}
			<div className="uc:flex uc:max-h-(--max-viewport-height) uc:gap-2 uc:px-4 uc:pb-2">
				{/* Sidebar */}
				<aside className="uc:w-64 uc:flex uc:flex-col">
					<Menu menuId="main-menu"></Menu>
				</aside>

				{/* Main Content Area */}
				<main className="uc:flex uc:flex-col uc:flex-1 uc:overflow-y-scroll uc:min-h-(--max-viewport-content-height) uc:p-6 uc:bg-[#FFFFFF] uc:rounded-xl">
					{children}
				</main>
			</div>
		</div>
	);
};

export default StandardLayout;
