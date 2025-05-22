import { useToastr } from '@app/shared/toastr/hooks/useToastr';
import { renderHook } from '@testing-library/react';

jest.mock('@shared/toastr/context/ToastrContext', () => ({ useToastrState: () => ({ dispatch: jest.fn() }) }));
jest.mock('@utils/functions', () => ({ id: () => 'test-id' }));

describe('useToastr', () => {
	it('should provide info, success, error, warning, and toastr methods', () => {
		const { result } = renderHook(() => useToastr(10));
		expect(typeof result.current.info).toBe('function');
		expect(typeof result.current.success).toBe('function');
		expect(typeof result.current.error).toBe('function');
		expect(typeof result.current.warning).toBe('function');
		expect(typeof result.current.toastr).toBe('function');
	});

	it('should call toastr and dispatch show/hide actions', () => {
		const { result } = renderHook(() => useToastr(1));
		const props = { title: 'Test', text: 'Test' };
		result.current.toastr(props);
	});

	it('should dispatch showToastr and hideToastr with correct payload for warning', () => {
		jest.useFakeTimers();
		const dispatch = jest.fn();
		jest.spyOn(require('@shared/toastr/context/ToastrContext'), 'useToastrState').mockReturnValue({ dispatch });
		const { result } = renderHook(() => useToastr(300));
		const props = { title: 'Warning', text: 'Warning text', options: { foo: 'baz', status: 'warning' as const } };
		result.current.warning(props);
		expect(dispatch).toHaveBeenCalledWith({
			type: 'showToastr',
			payload: { uuid: 'test-id', toastr: { ...props, options: { ...props.options, status: 'warning' } } }
		});
		jest.runAllTimers();
		expect(dispatch).toHaveBeenCalledWith({
			type: 'hideToastr',
			payload: { uuid: 'test-id' }
		});
		jest.useRealTimers();
	});

	it('should dispatch showToastr and hideToastr with correct payload for error', () => {
		jest.useFakeTimers();
		const dispatch = jest.fn();
		jest.spyOn(require('@shared/toastr/context/ToastrContext'), 'useToastrState').mockReturnValue({ dispatch });
		const { result } = renderHook(() => useToastr(400));
		const props = { title: 'Error', text: 'Error text', options: { foo: 'err', status: 'error' as const } };
		result.current.error(props);
		expect(dispatch).toHaveBeenCalledWith({
			type: 'showToastr',
			payload: { uuid: 'test-id', toastr: { ...props, options: { ...props.options, status: 'error' } } }
		});
		jest.runAllTimers();
		expect(dispatch).toHaveBeenCalledWith({
			type: 'hideToastr',
			payload: { uuid: 'test-id' }
		});
		jest.useRealTimers();
	});

	it('should create options if not provided and set correct status', () => {
		jest.useFakeTimers();
		const dispatch = jest.fn();
		jest.spyOn(require('@shared/toastr/context/ToastrContext'), 'useToastrState').mockReturnValue({ dispatch });
		const { result } = renderHook(() => useToastr(500));
		const props = { title: 'No options', text: 'No options text' };
		result.current.success(props);
		expect(dispatch).toHaveBeenCalledWith({
			type: 'showToastr',
			payload: { uuid: 'test-id', toastr: { ...props, options: { status: 'success' } } }
		});
		jest.runAllTimers();
		expect(dispatch).toHaveBeenCalledWith({
			type: 'hideToastr',
			payload: { uuid: 'test-id' }
		});
		jest.useRealTimers();
	});

	it('should dispatch showToastr and hideToastr with correct payload for info', () => {
		jest.useFakeTimers();
		const dispatch = jest.fn();
		jest.spyOn(require('@shared/toastr/context/ToastrContext'), 'useToastrState').mockReturnValue({ dispatch });
		const { result } = renderHook(() => useToastr(100));
		const props = { title: 'Info', text: 'Info text' };
		result.current.info(props);
		expect(dispatch).toHaveBeenCalledWith({
			type: 'showToastr',
			payload: { uuid: 'test-id', toastr: { ...props, options: { status: 'info' } } }
		});
		jest.runAllTimers();
		expect(dispatch).toHaveBeenCalledWith({
			type: 'hideToastr',
			payload: { uuid: 'test-id' }
		});
		jest.useRealTimers();
	});

	it('should dispatch showToastr and hideToastr with correct payload for success', () => {
		jest.useFakeTimers();
		const dispatch = jest.fn();
		jest.spyOn(require('@shared/toastr/context/ToastrContext'), 'useToastrState').mockReturnValue({ dispatch });
		const { result } = renderHook(() => useToastr(200));
		const props = { title: 'Success', text: 'Success text', options: { foo: 'bar', status: 'success' as const } };
		result.current.success(props);
		expect(dispatch).toHaveBeenCalledWith({
			type: 'showToastr',
			payload: { uuid: 'test-id', toastr: { ...props, options: { ...props.options, status: 'success' } } }
		});
		jest.runAllTimers();
		expect(dispatch).toHaveBeenCalledWith({
			type: 'hideToastr',
			payload: { uuid: 'test-id' }
		});
		jest.useRealTimers();
	});
});
