// utils/getValidDate.ts
/**
 * Returns tomorrow's date in dd/MM/yyyy format.
 */
export function getValidDate(): string {
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	const pad = (n: number) => (n < 10 ? '0' + n : n);
	return `${pad(tomorrow.getDate())}/${pad(tomorrow.getMonth() + 1)}/${tomorrow.getFullYear()}`;
}
