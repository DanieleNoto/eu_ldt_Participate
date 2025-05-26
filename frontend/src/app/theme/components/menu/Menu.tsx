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
					return 'uc:hover:bg-[#ead17b]';
				}
			}
			return 'uc:hover:bg-[#e5e7e8]';
		},
		[menuLevel]
	);

	const getNavLinkColor = useCallback(
		(isActive: boolean) => {
			if (isActive) {
				if (menuLevel === MenuLevel.PRIMARY) {
					return 'uc:bg-[#FBE186]';
				}
				return 'uc:bg-[#D8E2FF]';
			}
			return '';
		},
		[menuLevel]
	);

	const getTextColor = (isActive: boolean) => {
		const isSectionCompleted = false; // TODO[MEDIUM][20250305][IR]: implement logic to check if section is completed to have green text
		if (isSectionCompleted) {
			return 'uc:text-[#1E4620] uc:font-semibold';
		}
		if (isActive) {
			return 'uc:text-[#004494] uc:font-semibold';
		} else {
			return 'uc:text-[#3F484A] uc:font-normal';
		}
	};

	const renderMenuItemChildren = (menuItem: MenuItem, index: number) =>
		menuItem?.children && (
			<div className="uc:flex uc:flex-col">
				{menuItem.children.map((child, childIndex) => {
					const isCustomActive =
						location.pathname.includes('/parameters/') && child.title.includes('parameters');
					return (
						<>
							{child.disabled || !child.link ? (
								<div
									role="menuitem"
									key={index}
									className={`uc:flex uc:p-2 uc:pl-10 uc:rounded uc:transition-colors`}
									data-testid={`menu-item-${index}`}
								>
									<div
										className="uc:flex uc:py-2 uc:items-center"
										data-testid={`menu-item-${index}-icon`}
									>
										{child.iconKey && (
											<span className="uc:flex" aria-hidden="true">
												<CustomIcon iconKey={child.iconKey} />
											</span>
										)}
										<span className="uc:px-3">{t(child.title)}</span>
									</div>
								</div>
							) : (
								<NavLink
									key={childIndex}
									to={child.link || ''}
									className={({ isActive }) =>
										`uc:flex uc:items-center uc:h-[56px] uc:px-10 uc:rounded-[8px] uc:transition-colors uc:cursor-pointer ${getHoverColor(isActive || isCustomActive)} ${getNavLinkColor(isActive || isCustomActive)} ${getTextColor(isActive || isCustomActive)}`
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
			className="uc:flex-1 uc:px-3 uc:py-3 uc:overflow-y-auto uc:bg-[#F6F8FA] uc:text-[#3F484A] uc:rounded-xl"
			data-testid="menu"
		>
			{menuLevel === MenuLevel.PRIMARY && (
				<div
					className="uc:font-medium uc:px-2 uc:pb-3"
					role="heading"
					aria-level={2}
					data-testid={`menu-${MenuLevel.PRIMARY}`}
				>
					{t('sections.simulation')}
				</div>
			)}
			<ul className="uc:text-sm" role="menu" aria-labelledby={menuId} data-testid="menu-item">
				{menuItems.map((menuItem, index) => (
					<li key={index} role="none">
						{menuItem.disabled || !menuItem.link ? (
							<div
								role="menuitem"
								key={index}
								className={`uc:flex uc:p-2 uc:rounded uc:transition-colors`}
								data-testid={`menu-item-${index}`}
							>
								<div
									className="uc:flex uc:py-2 uc:items-center"
									data-testid={`menu-item-${index}-icon`}
								>
									{menuItem.iconKey && (
										<span className="uc:flex" aria-hidden="true">
											<CustomIcon iconKey={menuItem.iconKey} />
										</span>
									)}
									<span className="uc:px-3">{t(menuItem.title)}</span>
								</div>
							</div>
						) : (
							<>
								<NavLink
									role="menuitem"
									key={index}
									className={({ isActive }) =>
										`uc:flex uc:h-[56px] uc:p-2 uc:rounded-[8px] uc:transition-colors uc:cursor-pointer ${getHoverColor(isActive)} ${getNavLinkColor(isActive)} ${getTextColor(isActive)}`
									}
									to={menuItem.link || ''}
									data-testid={`menu-link-${index}`}
								>
									<div className="uc:flex uc:items-center" data-testid={`menu-link-${index}-content`}>
										{menuItem.iconKey && (
											<span className="uc:flex" aria-hidden="true">
												<CustomIcon iconKey={menuItem.iconKey} />
											</span>
										)}
										<span className="uc:px-3">{t(menuItem.title)}</span>
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
