// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
import { render } from '@testing-library/react';
import CustomIcon, { IconKey } from '@app/shared/Icon/CustomIcon';
import '@testing-library/jest-dom';

describe('CustomIcon', () => {
	it('should render chat icon', () => {
		const { container } = render(<CustomIcon iconKey="chat" />);
		const svgElement = container.querySelector('svg');
		expect(svgElement).toBeInTheDocument();
	});

	it('should render help icon', () => {
		const { container } = render(<CustomIcon iconKey="help" />);
		const svgElement = container.querySelector('svg');
		expect(svgElement).toBeInTheDocument();
	});

	it('should render home icon', () => {
		const { container } = render(<CustomIcon iconKey="home" />);
		const svgElement = container.querySelector('svg');
		expect(svgElement).toBeInTheDocument();
	});

	it('should render info icon', () => {
		const { container } = render(<CustomIcon iconKey="info" />);
		const svgElement = container.querySelector('svg');
		expect(svgElement).toBeInTheDocument();
	});

	it('should render settings icon', () => {
		const { container } = render(<CustomIcon iconKey="settings" />);
		const svgElement = container.querySelector('svg');
		expect(svgElement).toBeInTheDocument();
	});

	it('should render support icon', () => {
		const { container } = render(<CustomIcon iconKey="support" />);
		const svgElement = container.querySelector('svg');
		expect(svgElement).toBeInTheDocument();
	});

	it('should apply custom icon props', () => {
		const { container } = render(
			<CustomIcon 
				iconKey="chat" 
				iconProps={{ 
					fontSize: 'large',
					color: 'primary'
				}} 
			/>
		);
		const svgElement = container.querySelector('svg');
		expect(svgElement).toBeInTheDocument();
		expect(svgElement).toHaveClass('MuiSvgIcon-fontSizeLarge');
		expect(svgElement).toHaveClass('MuiSvgIcon-colorPrimary');
	});

	it('should default to chat icon for invalid icon key', () => {
		const { container } = render(
			<CustomIcon iconKey={'invalid' as IconKey} />
		);
		const svgElement = container.querySelector('svg');
		expect(svgElement).toBeInTheDocument();
	});

	it('should have fontSize small by default', () => {
		const { container } = render(<CustomIcon iconKey="chat" />);
		const svgElement = container.querySelector('svg');
		expect(svgElement).toHaveClass('MuiSvgIcon-fontSizeSmall');
	});
});
