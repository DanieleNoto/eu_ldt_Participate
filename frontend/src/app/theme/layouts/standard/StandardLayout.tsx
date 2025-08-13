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
		<div className="max-h-screen bg-gray-100">
			{standalone && (
				<>
					<AppHeader></AppHeader>
					<ToolHeader></ToolHeader>
				</>
			)}

			<div
				className={`flex max-h-(--max-viewport-height) gap-2 px-4 py-2 `}
				role="region"
				aria-label="Main content area"
			>
				<div className="flex flex-col items-center">{isMainMenuActive && <MainMenu />}</div>
				<div className={`flex flex-col w-full  ${section ? 'bg-white rounded-xl' : ''}`}>
					<Section />

					{/* Sidebar */}
					<div className="flex overflow-hidden mt-2">
						{isMenuActive && (
							<aside className={`w-64 flex flex-col  ${section ? 'p-2' : 'px-2'}`}>
								<Menu menuId="main-menu"></Menu>
							</aside>
						)}

						{/* Main Content Area */}
						<main
							className={`flex flex-col flex-1 overflow-y-auto bg-[#FFFFFF] rounded-xl ${section ? 'min-h-(--max-viewport-content-section-height)' : 'min-h-(--max-viewport-content-height)'}`}
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
