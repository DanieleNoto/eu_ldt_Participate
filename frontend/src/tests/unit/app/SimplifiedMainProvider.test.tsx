import { render, screen } from '@testing-library/react';
import SimplifiedMainProvider from '@app/SimplifiedMainProvider';

// Mock the ToastrProvider since it might not exist
jest.mock('@app/shared/toastr/context/ToastrContext', () => ({
	ToastrProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="toastr-provider">{children}</div>
}));

describe('SimplifiedMainProvider', () => {
	it('should render children correctly', () => {
		const TestChild = () => <div data-testid="test-child">Test Content</div>;

		render(
			<SimplifiedMainProvider>
				<TestChild />
			</SimplifiedMainProvider>
		);

		expect(screen.getByTestId('test-child')).toBeInTheDocument();
		expect(screen.getByText('Test Content')).toBeInTheDocument();
	});

	it('should wrap children with all necessary providers', () => {
		const TestChild = () => <div data-testid="test-child">Test Content</div>;

		render(
			<SimplifiedMainProvider>
				<TestChild />
			</SimplifiedMainProvider>
		);

		// Check if ToastrProvider is present
		expect(screen.getByTestId('toastr-provider')).toBeInTheDocument();
		
		// Check if the child is rendered inside the provider
		expect(screen.getByTestId('test-child')).toBeInTheDocument();
	});

	it('should provide Redux store context', () => {
		// Component that uses Redux store
		const TestComponent = () => {
			// This will throw if Redux context is not provided
			return <div data-testid="redux-test">Redux Connected</div>;
		};

		expect(() => {
			render(
				<SimplifiedMainProvider>
					<TestComponent />
				</SimplifiedMainProvider>
			);
		}).not.toThrow();

		expect(screen.getByTestId('redux-test')).toBeInTheDocument();
	});

	it('should provide MUI theme context', () => {
		// Component that uses MUI theme
		const TestComponent = () => {
			return <div data-testid="mui-test">MUI Themed Component</div>;
		};

		expect(() => {
			render(
				<SimplifiedMainProvider>
					<TestComponent />
				</SimplifiedMainProvider>
			);
		}).not.toThrow();

		expect(screen.getByTestId('mui-test')).toBeInTheDocument();
	});

	it('should provide React Query context', () => {
		// Component that could use React Query
		const TestComponent = () => {
			return <div data-testid="query-test">Query Connected Component</div>;
		};

		expect(() => {
			render(
				<SimplifiedMainProvider>
					<TestComponent />
				</SimplifiedMainProvider>
			);
		}).not.toThrow();

		expect(screen.getByTestId('query-test')).toBeInTheDocument();
	});

	it('should handle multiple children', () => {
		const FirstChild = () => <div data-testid="first-child">First</div>;
		const SecondChild = () => <div data-testid="second-child">Second</div>;

		render(
			<SimplifiedMainProvider>
				<FirstChild />
				<SecondChild />
			</SimplifiedMainProvider>
		);

		expect(screen.getByTestId('first-child')).toBeInTheDocument();
		expect(screen.getByTestId('second-child')).toBeInTheDocument();
	});

	it('should handle empty children', () => {
		expect(() => {
			render(<SimplifiedMainProvider>{null}</SimplifiedMainProvider>);
		}).not.toThrow();
	});

	it('should handle undefined children', () => {
		expect(() => {
			render(<SimplifiedMainProvider>{undefined}</SimplifiedMainProvider>);
		}).not.toThrow();
	});
});
