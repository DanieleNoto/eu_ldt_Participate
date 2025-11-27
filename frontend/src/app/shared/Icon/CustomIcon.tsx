// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { SvgIconProps } from '@mui/material/SvgIcon';

const iconMap = {
	chat: ChatBubbleOutlineIcon,
	help: HelpOutlineOutlinedIcon,
	home: HomeOutlinedIcon,
	info: InfoOutlinedIcon,
	settings: SettingsOutlinedIcon,
	support: FeedbackOutlinedIcon
};

export type IconKey = keyof typeof iconMap;

interface CustomIconProps {
	iconKey: IconKey;
	iconProps?: SvgIconProps;
}

const CustomIcon = ({ iconKey, iconProps }: CustomIconProps) => {
	const IconComponent = iconMap[iconKey] ?? ChatBubbleOutlineIcon;
	return <IconComponent fontSize="small" {...iconProps} />;
};

export default CustomIcon;
