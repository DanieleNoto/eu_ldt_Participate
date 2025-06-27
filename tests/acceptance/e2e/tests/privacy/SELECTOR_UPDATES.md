# Cookie Banner HTML Analysis and Selector Updates

## HTML Structure Analysis

Based on the provided HTML, the cookie banner has the following structure:

```html
<div id="dc-dialog-wrapper" class="cookies__container" data-nosnippet="" role="region">
	<div class="cookies">
		<div class="cookies__left">
			<!-- Information text -->
		</div>
		<div class="cookies__right">
			<button id="dc-dialog-accept" class="button button__sm button__secondary">Accept all</button>
			<button id="dc-dialog-reject" class="button button__sm button__transparent-secondary">
				Accept only essential
			</button>
			<button
				id="dc-dialog-settings"
				class="button button__sm button__transparent-secondary"
				data-dialog-open="dc-modal"
				aria-haspopup="dialog"
			>
				Settings
			</button>
		</div>
	</div>
</div>
```

## Key Observations

1. **Banner Container**: `#dc-dialog-wrapper` with class `cookies__container`
2. **Accept All Button**: `#dc-dialog-accept`
3. **Accept Essential Button**: `#dc-dialog-reject` (Note: This is actually "Accept only essential", not reject)
4. **Settings Button**: `#dc-dialog-settings` with `data-dialog-open="dc-modal"`
5. **Modal Target**: The settings button opens `dc-modal`

## Updates Made

### 1. Constants Updated (`constants.ts`)

```typescript
COOKIES: {
    BANNER: '#dc-dialog-wrapper.cookies__container',
    BANNER_WRAPPER: '#dc-dialog-wrapper',
    ACCEPT_ALL_BUTTON: '#dc-dialog-accept',
    ACCEPT_ESSENTIAL_BUTTON: '#dc-dialog-reject',
    REJECT_ALL_BUTTON: 'button[data-testid="reject-all-cookies"]', // Keep as fallback
    SETTINGS_BUTTON: '#dc-dialog-settings',
    DIALOG: '[data-dialog-target="dc-modal"]',
    MODAL: '#dc-modal',
    PREFERENCES_CHECKBOX: '#dc-preferences',
    ANALYTICS_CHECKBOX: '#dc-analytics',
    MARKETING_CHECKBOX: '#dc-marketing',
    SAVE_BUTTON: 'button[data-testid="save-cookie-settings"]'
}
```

### 2. CookieSettingsComponent Updated

- **Banner Detection**: Changed from text-based to ID-based selector
- **Button Targeting**: Now uses specific IDs instead of role-based selectors
- **Modal Handling**: Updated to use `#dc-modal` instead of generic `[role="dialog"]`
- **Consistency**: All selectors now use constants for maintainability

### 3. Benefits of Changes

✅ **More Reliable**: ID selectors are more stable than text-based selectors
✅ **Performance**: ID selectors are faster than text searches
✅ **Maintainability**: Centralized selectors in constants
✅ **Language Independence**: Not dependent on button text translations
✅ **Specificity**: Targets exact elements instead of searching by role

### 4. Naming Convention Note

The HTML uses `dc-dialog-reject` for "Accept only essential" button, which might seem confusing. This appears to be the framework's naming convention where "reject" means rejecting non-essential cookies while accepting essential ones.

## Testing Impact

These changes should make the tests more reliable and faster, as they now target specific HTML elements using their IDs rather than searching for text content or generic roles.
