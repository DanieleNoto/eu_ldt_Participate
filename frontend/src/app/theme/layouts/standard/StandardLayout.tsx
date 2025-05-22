import { useAppSelector } from '@app/store/hook';
import { selectAppIsMainMenuActive, selectAppIsMenuActive, selectSection } from '@app/store/main/main-slice.selectors';
import AppHeader from '@app/theme/components/header/AppHeader';
import ToolHeader from '@app/theme/components/header/ToolHeader';
import Menu from '@app/theme/components/menu/Menu';
import { ReactNode } from 'react';
import Section from '@app/theme/components/section/Section';
import { SectionModel } from '@app/theme/components/section/section.model';
import MainMenu from '@app/theme/components/menu/MainMenu';

interface StandardLayoutProps {
	children?: ReactNode;
	standalone: boolean;
}

export const StandardLayout = ({ children, standalone = false }: StandardLayoutProps) => {
	const section = useAppSelector(selectSection) as SectionModel;
	const isMainMenuActive = useAppSelector(selectAppIsMainMenuActive);
	const isMenuActive = useAppSelector(selectAppIsMenuActive);

	return (
		<div className="uc:max-h-screen uc:bg-gray-100">
			{standalone && (
				<>
					<AppHeader></AppHeader>
					<ToolHeader></ToolHeader>
				</>
			)}

			<div
				className={`uc:flex uc:max-h-(--max-viewport-height) uc:gap-2 uc:px-4 uc:py-2 `}
				role="region"
				aria-label="Main content area"
			>
				<div className="uc:flex uc:flex-col uc:items-center">{isMainMenuActive && <MainMenu />}</div>
				<div className={`uc:flex uc:flex-col uc:w-full  ${section ? 'uc:bg-white uc:rounded-xl' : ''}`}>
					<Section />

					{/* Sidebar */}
					<div className="uc:flex uc:overflow-hidden uc:mt-2">
						{isMenuActive && (
							<aside className={`uc:w-64 uc:flex uc:flex-col  ${section ? 'uc:p-2' : 'uc:px-2'}`}>
								<Menu menuId="main-menu"></Menu>
							</aside>
						)}

						{/* Main Content Area */}
						<main
							className={`uc:flex uc:flex-col uc:flex-1 uc:overflow-y-auto uc:bg-[#FFFFFF] uc:rounded-xl ${section ? 'uc:min-h-(--max-viewport-content-section-height)' : 'uc:min-h-(--max-viewport-content-height)'}`}
						>
							{children}
						</main>
					</div>
				</div>
			</div>
		</div>
	);
};

export default StandardLayout;
