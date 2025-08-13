import { MenuItem } from '@app/core/models/menuItem.model';
import { getMenuItems, MenuLevel } from '@app/pages/Pages.menu';
import CustomIcon from '@app/shared/Icon/CustomIcon';
import { useAppSelector } from '@app/store/hook';
import { selectMenuItems, selectSection } from '@app/store/main/main-slice.selectors';
import { useUIState } from '@theme/context/UI';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router';

interface Props {
	menuId: string;
}

const Menu = ({ menuId }: Props) => {
	const { t } = useTranslation();
	const location = useLocation();
	const [menuItems, setMenuItems] = useState<MenuItem[]>(getMenuItems());
	const [menuLevel, setMenuLevel] = useState<MenuLevel>(MenuLevel.PRIMARY);
	const { dispatch } = useUIState();
	const menuItemsFromState = useAppSelector(selectMenuItems);
	const section = useAppSelector(selectSection);

	useEffect(() => {
		dispatch({ type: 'setOpenMenu', payload: false });
		if (menuItemsFromState && menuItemsFromState.length > 0) {
			setMenuItems(menuItemsFromState);
		}

		if (section) {
			setMenuLevel(MenuLevel.SECONDARY);
		} else {
			setMenuLevel(MenuLevel.PRIMARY);
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location, menuItemsFromState]);

	const getHoverColor = useCallback(
		(isActive: boolean) => {
			if (isActive) {
				if (menuLevel === MenuLevel.PRIMARY) {
					return 'hover:bg-[#ead17b]';
				}
			}
			return 'hover:bg-[#e5e7e8]';
		},
		[menuLevel]
	);

	const getNavLinkColor = useCallback(
		(isActive: boolean) => {
			if (isActive) {
				if (menuLevel === MenuLevel.PRIMARY) {
					return 'bg-[#FBE186]';
				}
				return 'bg-[#D8E2FF]';
			}
			return '';
		},
		[menuLevel]
	);

	const getTextColor = (isActive: boolean) => {
		const isSectionCompleted = false; // TODO[MEDIUM][20250305][IR]: implement logic to check if section is completed to have green text
		if (isSectionCompleted) {
			return 'text-[#1E4620] font-semibold';
		}
		if (isActive) {
			return 'text-[#004494] font-semibold';
		} else {
			return 'text-[#3F484A] font-normal';
		}
	};

	const renderMenuItemChildren = (menuItem: MenuItem, index: number) =>
		menuItem?.children && (
			<div className="flex flex-col">
				{menuItem.children.map((child, childIndex) => {
					const isCustomActive =
						location.pathname.includes('/parameters/') && child.title.includes('parameters');
					return (
						<>
							{child.disabled || !child.link ? (
								<div
									role="menuitem"
									key={index}
									className={`flex p-2 pl-10 rounded transition-colors`}
									data-testid={`menu-item-${index}`}
								>
									<div
										className="flex py-2 items-center"
										data-testid={`menu-item-${index}-icon`}
									>
										{child.iconKey && (
											<span className="flex" aria-hidden="true">
												<CustomIcon iconKey={child.iconKey} />
											</span>
										)}
										<span className="px-3">{t(child.title)}</span>
									</div>
								</div>
							) : (
								<NavLink
									key={childIndex}
									to={child.link || ''}
									className={({ isActive }) =>
										`flex items-center h-[56px] px-10 rounded-[8px] transition-colors cursor-pointer ${getHoverColor(isActive || isCustomActive)} ${getNavLinkColor(isActive || isCustomActive)} ${getTextColor(isActive || isCustomActive)}`
									}
									data-testid={`menu-link-${index}-child-${childIndex}`}
								>
									{t(child.title)}
								</NavLink>
							)}
						</>
					);
				})}
			</div>
		);

	return (
		<nav
			id={menuId}
			aria-label="Menu di navigazione principale"
			className="flex-1 px-3 py-3 overflow-y-auto bg-[#F6F8FA] text-[#3F484A] rounded-xl"
			data-testid="menu"
		>
			{menuLevel === MenuLevel.PRIMARY && (
				<div
					className="font-medium px-2 pb-3"
					role="heading"
					aria-level={2}
					data-testid={`menu-${MenuLevel.PRIMARY}`}
				>
					{t('sections.simulation')}
				</div>
			)}
			<ul className="text-sm" role="menu" aria-labelledby={menuId} data-testid="menu-item">
				{menuItems.map((menuItem, index) => (
					<li key={index} role="none">
						{menuItem.disabled || !menuItem.link ? (
							<div
								role="menuitem"
								key={index}
								className={`flex p-2 rounded transition-colors`}
								data-testid={`menu-item-${index}`}
							>
								<div
									className="flex py-2 items-center"
									data-testid={`menu-item-${index}-icon`}
								>
									{menuItem.iconKey && (
										<span className="flex" aria-hidden="true">
											<CustomIcon iconKey={menuItem.iconKey} />
										</span>
									)}
									<span className="px-3">{t(menuItem.title)}</span>
								</div>
							</div>
						) : (
							<>
								<NavLink
									role="menuitem"
									key={index}
									className={({ isActive }) =>
										`flex h-[56px] p-2 rounded-[8px] transition-colors cursor-pointer ${getHoverColor(isActive)} ${getNavLinkColor(isActive)} ${getTextColor(isActive)}`
									}
									to={menuItem.link || ''}
									data-testid={`menu-link-${index}`}
								>
									<div className="flex items-center" data-testid={`menu-link-${index}-content`}>
										{menuItem.iconKey && (
											<span className="flex" aria-hidden="true">
												<CustomIcon iconKey={menuItem.iconKey} />
											</span>
										)}
										<span className="px-3">{t(menuItem.title)}</span>
									</div>
								</NavLink>
							</>
						)}
						{renderMenuItemChildren(menuItem, index)}
					</li>
				))}
			</ul>
		</nav>
	);
};

export default Menu;
