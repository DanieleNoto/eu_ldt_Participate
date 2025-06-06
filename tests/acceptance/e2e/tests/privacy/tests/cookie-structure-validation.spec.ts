import { test, expect } from '@playwright/test';

test('Validate decidim-consent cookie structure parsing', async () => {
	const providedCookieValue =
		'{%22essential%22:true%2C%22preferences%22:true%2C%22analytics%22:true%2C%22marketing%22:true}';

	const decodedValue = decodeURIComponent(providedCookieValue);
	console.log('Decoded decidim-consent cookie value:', decodedValue);

	const parsed = JSON.parse(decodedValue);
	console.log('Parsed decidim-consent cookie structure:', parsed);

	expect(parsed).toEqual({
		essential: true,
		preferences: true,
		analytics: true,
		marketing: true
	});

	const reEncoded = encodeURIComponent(JSON.stringify(parsed));
	console.log('Re-encoded value:', reEncoded);

	const reDecoded = JSON.parse(decodeURIComponent(reEncoded));
	expect(reDecoded).toEqual(parsed);

	const customPrefs = {
		essential: true,
		preferences: false,
		analytics: true,
		marketing: false
	};

	const customEncoded = encodeURIComponent(JSON.stringify(customPrefs));
	const customDecoded = JSON.parse(decodeURIComponent(customEncoded));

	expect(customDecoded).toEqual(customPrefs);
	console.log('Custom preferences work correctly:', customDecoded);
});
