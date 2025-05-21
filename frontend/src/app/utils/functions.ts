/**
 * Return un unique id for HTML element
 * @returns string
 */

export const id = () => {
	return 'id-' + Math.random().toString(36).substr(2, 9);
};

export const nop = (): void => {};
