# EU LDT Participate Chatbot Web Component

This chatbot is built as a web component that can be embedded in any webpage. It supports multiple languages and sends the language parameter to the backend API.

## Usage

### As a Web Component (Custom Element)

```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Chatbot Integration Example</title>
	</head>
	<body>
		<!-- Load the remote chatbot component -->
		<script type="module" crossorigin src="http://your-frontend-host/remoteEntry.js"></script>

		<!-- Use the chatbot custom element -->
		<eu-chatbot language="en"></eu-chatbot>

		<!-- You can also listen for events -->
		<script>
			document.addEventListener('supportSent', event => {
				console.log('Support request sent at:', event.detail.timestamp);
			});

			// You can change the language dynamically
			const chatbot = document.querySelector('eu-chatbot');
			chatbot.setAttribute('language', 'es'); // Change to Spanish
		</script>
	</body>
</html>
```

### As a Module Federation Remote

```javascript
// In your host application
import React from 'react';
const RemoteChatbot = React.lazy(() => import('remote/chatbot-element'));

function App() {
	return (
		<div>
			<h1>My Application</h1>
			<React.Suspense fallback={<div>Loading chatbot...</div>}>
				<RemoteChatbot language="en" />
			</React.Suspense>
		</div>
	);
}
```

## Supported Attributes

- `language` (optional): The language code for the chatbot. Defaults to 'en' (English).
    - Supported values: 'en', 'es', 'fr', 'de', etc. (depending on backend configuration)

## Events

- `supportSent`: Fired when a support request is sent successfully
    - Detail: `{ timestamp: string }`

## API Integration

The chatbot automatically sends the language parameter to the backend API:

```typescript
// Request payload to /api/v1/chat/
{
    "conversationId": "uuid-v4",
    "nodeId": "root",
    "language": "en"
}
```

The backend should handle the language parameter and return localized responses.

## Development

### Building the Web Component

```bash
cd frontend
npm run build
```

The built component will be available at `/dist/remoteEntry.js`

### Running in Development

```bash
cd frontend
npm run dev
```

The chatbot will be available at `http://localhost:5001`

## Configuration

The chatbot loads its configuration from `/config/config.json`. Make sure this file is accessible from the hosting domain.

Example config.json:

```json
{
	"apiBaseUrl": "http://localhost:3000",
	"defaultLanguage": "en"
}
```
