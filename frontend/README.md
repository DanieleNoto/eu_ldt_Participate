# Eu LDT Starter FE

A React + TypeScript starter project built with Vite that provides a modular architecture including routing, API communication, logging, internationalization (i18n), toast notifications, and more.

## Overview

This project is designed as a starter template for scalable front-end applications. It leverages React with TypeScript and Vite, providing built-in support for:

- Routing with code splitting and lazy loading.
- A configurable API client with detailed logging and response mapping.
- A robust logging mechanism using **pino**.
- Internationalization (i18n) with **react-i18next**.
- Toast notifications integrated with Material-UI.
- Custom hooks and utilities to support common tasks.

## 🚀 Commit Conventions

This project follows Conventional Commits:

```plaintext
<type>(<scope>): <message>
```

Types:

- feat: New feature.
- fix: Bug fix.
- chore: Maintenance tasks.
- docs: Documentation updates.
- test: Adding or updating tests.
- refactor: Code refactoring without changing functionality.

## ✅ TODO Conventions

- **[HIGH]** Critical tasks.
- **[MEDIUM]** Important but non-urgent tasks.
- **[LOW]** Nice-to-have improvements.
- Includes date and author.

**Example:**

```javascript
// TODO [HIGH][20250205][JohnDoe]: Implement Redis caching for performance.
```

## Dependencies

The project uses a number of libraries to support its features:

- **React** and **React DOM** – Core UI libraries.
- **TypeScript** – For static typing.
- **Vite** – Fast build tool and dev server.
- **Tailwind CSS** – Utility-first CSS framework.
- **MUI (Material-UI)** – For UI components.
- **react-router-dom** – For client-side routing.
- **@tanstack/react-query** – For data fetching and caching.
- **i18next** and **react-i18next** – For internationalization.
- **pino** – For logging.
- **Husky**, **lint-staged**, **commitlint**, and **commitizen** – For enforcing code quality and commit conventions.

For a complete list, please refer to the `package.json` file.

## 📂 Directory Overview

The project is organized to promote separation of concerns and scalability.
Below is a simplified view of the structure:

/project-root
│
├── src
│ ├── app
│ │ ├── core
│ │ │ ├── api-client # API client module for backend communication
│ │ │ ├── error # Error boundaries for error handling
│ │ │ ├── logger # Logging module using pino
│ │ │ └── router # Custom router components and context management
│ │ ├── pages # Page components and route definitions
│ │ ├── shared # Shared utilities and providers (e.g., auth, toast notifications)
│ │ ├── theme # Theming components (header, footer, menu, layouts)
│ │ └── utils # Utility functions and custom hooks
│ ├── config # Application configuration files (API, logger, etc.)
│ ├── i18n.ts # Internationalization setup
│ └── main.tsx # Application entry point
│ ├── public # Public assets and configuration files
├── tests # Unit and integration tests
├── .husky # Git hooks configuration
├── tailwind.config.js # Tailwind CSS configuration
├── tsconfig.json # TypeScript configuration
└── vite.config.ts # Vite configuration

### Root-Level Overview

- **`.husky/`**  
  Contains Git hooks (e.g., `pre-commit`, `commit-msg`) configured via Husky to enforce commit standards, run linting, and format code before commits.

- **`.lintstagedrc`**  
  Configuration for lint-staged. This ensures that code quality checks (e.g., ESLint, Prettier) run on staged files during commits.

- **`.nvmrc`**  
  Specifies the Node.js version required by the project.

- **`.prettierrc` & `eslint.config.js`**  
  Configuration files for Prettier and ESLint, respectively, to ensure a consistent code style and catch potential issues.

- **`index.html`**  
  The main HTML file served by Vite, where the React app is mounted.

- **`package.json`**  
  Lists project dependencies, scripts, and metadata.

- **`postcss.config.cjs`**  
  Configuration for PostCSS, integrating Tailwind CSS and autoprefixer.

- **`public/`**  
  Contains static assets such as images, configuration files (e.g., `config.json`), and internationalization (i18n) resources.

- **`tailwind.config.js`**  
  Tailwind CSS configuration for customizing design tokens and utility classes.

- **`tsconfig*.json`**  
  TypeScript configuration files defining compiler options.

- **`vite.config.ts`**  
  Vite configuration for development and build settings.

- **`utils/`**  
  Contains additional utility scripts (e.g., commit scripts) and other non-application code.

---

### `src/` Directory

This is the main source folder for the application code.

#### `src/app/`

This folder contains the core application code, organized into multiple subdirectories:

- **`core/`**  
  Contains modules that provide fundamental functionality:

    - **`api-client/`**:  
      Implements a centralized API client to handle HTTP requests, dynamic URL parameters, query strings, header merging, and response mapping using model classes.
    - **`error/`**:  
      Contains an `ErrorBoundary` component for catching and logging React errors.
    - **`logger/`**:  
      Provides a logging utility (using [pino](https://getpino.io/)) for structured logging across the application.
    - **`router/`**:  
      Contains custom routing components (e.g., `Router`, `LazyRoute`, `RouteWrapper`) and context for managing routing state.

- **`pages/`**  
  Contains the presentation layer of the application, including page components and their routing:

    - **`dashboard/`**:  
      Contains components and pages for the dashboard feature.
    - **`example/`** (Reference Module)  
      This directory serves as a template for structuring a feature:
        - **`dtos/`**:  
          Data Transfer Objects that describe the shape of API responses.
        - **`models/`**:  
          Contains model definitions and mapping functions (e.g., a static `fromDto` method) to convert raw API data into structured objects.
        - **`pages/`**:  
          Houses React components for the feature’s UI (for example, forms, query demos, dialogs, and utility components).
        - **`services/`**:  
          Contains service functions (e.g., `example.service.ts`) that utilize the API client to fetch and process data.
        - **`Example.routes.tsx`**:  
          Configures the routes specific to the example feature.
        - **`Example.tsx`**:  
          Acts as the container component for the example feature.
    - **`Pages.menu.tsx`**  
      Defines the navigation menu configuration used across the application.
    - **`Pages.routes.tsx`**  
      Aggregates the routes from various page modules and feeds them into the main router.
    - **`Pages.tsx`**  
      Serves as a container for the pages, often wrapped inside a layout.

- **`shared/`**  
  Contains shared components and contexts used throughout the application:

    - **`forms/`**:  
      Reusable form components.
    - **`providers/`**:  
      Global context providers (for authentication, user data, etc.).
    - **`toastr/`**:  
      Components, hooks (such as `useToastr`), and context for toast notifications.

- **`theme/`**  
  Contains theming and styling resources:

    - **`components/`**:  
      UI elements like headers, footers, and menus.
    - **`context/`**:  
      Context providers for UI state (e.g., toggling sidebars).
    - **`layouts/`**:  
      Layout components (e.g., the Standard Layout) that define common page structure (header, sidebar, content, footer).
    - **`styles/`**:  
      Global CSS styles (including Tailwind CSS base styles).

- **`utils/`**  
  Provides utility functions and custom hooks:
    - **`functions.ts`**:  
      General helper functions (e.g., generating unique IDs).
    - **`hooks/`**:  
      Custom React hooks for focus management, intersection observation, sticky behavior, and transitions.
    - **`lib/`**:  
      Small libraries for specific tasks (e.g., argument validation, number conversion).

#### `src/config/`

Holds configuration files for various parts of the application:

- **`api-config.ts`**:  
  Specifies the API endpoints, request methods, and default headers.
- **`dateFns.config.ts`**:  
  Configures date formatting and parsing options using date-fns.
- **`front-end.config.ts`**:  
  Contains front-end-specific settings (e.g., base path).
- **`logger.config.ts`**:  
  Sets the logging level and other logger options.
- **`toastr.config.ts`**:  
  Defines default options for toast notifications (positions, delay, etc.).

### Using Feature Modules (Example: /example)

The /example directory under src/app/pages/example serves as a template for how to structure a feature:

- **DTOs and Models**:
  Define your data structures in dtos/ and convert raw API data into structured objects using methods like fromDto in models/.

- **Pages**:
  Build the UI components for your feature under pages/. You might have subdirectories for forms, dialogs, queries, etc.

- **Services**:
  Use services/ to encapsulate API calls. For instance, example.service.ts uses the API client to fetch data and maps it using your models.

- **Routing**:
  Define feature-specific routes in Example.routes.tsx and use lazy loading with LazyRoute to split code. The container component Example.tsx wraps these pages.

### Other Key Files

- **`src/i18n.ts`**  
  Configures internationalization using i18next and react-i18next.
- **`src/main.tsx`**  
  The application entry point. It loads runtime configuration (e.g., from `/public/config/config.json`), then renders the app inside providers like `BrowserRouter` and others.
- **`src/tests/`**  
  Contains unit tests for the application.
- **`src/vite-env.d.ts`**  
  Provides TypeScript definitions for Vite.

## Getting Started

### Prerequisites

- **Node.js** (v14 or later recommended)
- **npm** (or yarn)

### Installation

1. **Clone the repository:**
    ```bash
        git clone <repository-url>
        cd euldt-participate-chatbot-fe
    ```
2. **Install dependencies**:
    ```bash
        npm install
    ```
3. **Running the Development Server**
   Start the development server using Vite:
   `     npm run dev  `
   By default, the application runs on http://localhost:5001.

## API Client

The API client module located in src/app/core/api-client provides:

- Configurable endpoints: Define and retrieve API configurations.
- Dynamic URL parameters: Supports binding of path and query parameters.
- Response mapping: Utilizes model classes with static fromDto methods to map responses.
- Detailed logging: Logs request parameters, responses, and errors to assist in debugging.

### Design Details

1. **Configuration & Initialization:**

    - The client uses a configuration object that contains the `backend` configuration (base URL, list of APIs).
    - It retrieves the configuration for a given API name using the method `this.config.getApiConfig(apiName)`.
    - If the API URL is not absolute, it automatically prefixes it with the base URL.

2. **Request Workflow:**

    - **Request Method:**  
      The primary method is `request<T>({ apiName, body, queryParams, pathParams, headers, model })`.

        - It logs the starting message with detailed parameters.
        - It retrieves the proper API configuration.
        - It ensures the URL is fully qualified (prepends the base URL if necessary).

    - **Binding Parameters:**  
      The `_bindPathParams` method replaces placeholders in the URL (formatted as `{param}`) with values from the `pathParams` object.

    - **Query Parameters:**  
      The `_getQueryParams` method converts an object into an instance of `URLSearchParams`, which is appended to the URL.

    - **Header Merging:**  
      The `_getHeaders` method combines default headers from the API configuration with any additional headers provided in the request.

    - **Fetch & Timeout:**  
      The client uses the native `fetch` API. Note that native fetch does not support timeouts, so any timeout functionality must be implemented externally or via a different HTTP library if needed.

    - **Response Handling:**  
      The `_handleSuccessResponseWithMapper` method:

        - Converts the response to JSON.
        - If a model is provided, it maps the raw JSON data to model instances using the model’s static `fromDto` method.
        - Logs detailed information about the received data.

        In case of errors, `_handleErrorResponse` logs the error details and rethrows the error.

### Usage Example

Assuming you have defined an API endpoint in your configuration and a corresponding model with a `fromDto` method, you can make a request as follows:

```typescript
import { ApiClient } from '@app/core/api-client/api-client';
import { MyModel } from '@app/pages/myModule/models/MyModel';

async function fetchData() {
	try {
		const data = await ApiClient.request({
			apiName: 'FETCH_MY_DATA',
			queryParams: { limit: 10 },
			model: MyModel
		});
		console.log('Mapped data:', data);
	} catch (error) {
		console.error('API request failed:', error);
	}
}
```

## Logger

The logger module, found in src/app/core/logger, uses pino and includes:

- Configurable log levels: Set via the application configuration.
- Structured logging: Provides detailed logs of API requests, responses, and internal events.
- Consistent format: Eases debugging and log analysis.

## Router

Custom routing is implemented on top of react-router-dom. Key components include:

- LazyRoute: For lazy loading and code splitting.
- Router: Registers and renders routes dynamically.
- RouteWrapper: Enhances routes with additional metadata (e.g., SEO, breadcrumbs).
- Router Context: Provides a centralized state for route management.

### Design Details

1. **Router Component**:

- **Initialization**:
  The Router component receives an array of route definitions. On mount, it dispatches an action to update the global router state with these routes.

- **Rendering**:
  It maps over the route configuration to produce <Route> components for react-router-dom.

2. **LazyRoute Component**:

- Wraps lazy-loaded route components in a <Suspense> component.
- Provides a default fallback UI (e.g., a loading spinner).

3. **RouteWrapper & Context**:

- The RouteWrapper component injects additional data (e.g., SEO titles, breadcrumbs) into the router state via RouterContext.
- On mount and unmount, it registers or cleans up route metadata.

### Usage Example

Define your route configuration in a file like src/app/pages/Pages.routes.tsx:

```tsx
import { lazy } from 'react';
import { RouteInfo } from '@app/core/router/interfaces/RouteInfo';
import LazyRoute from '@app/core/router/components/LazyRoute';

const Dashboard = lazy(() => import('./dashboard/Dashboard'));
const Example = lazy(() => import('./example/Example'));

const pagesRoutes: RouteInfo[] = [
	{
		path: 'dashboard',
		element: (
			<LazyRoute>
				<Dashboard />
			</LazyRoute>
		),
		data: {
			seo: { title: 'Dashboard' },
			breadcrumb: 'Dashboard'
		}
	},
	{
		path: 'example',
		element: (
			<LazyRoute>
				<Example />
			</LazyRoute>
		)
	}
];
```

export default pagesRoutes;
In your main application file, wrap your app with the RouterProvider:

```tsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import App from '@app/App';
import { RouterProvider } from '@app/core/router/context/RouterContext';

function Main() {
	return (
		<BrowserRouter>
			<RouterProvider>
				<App />
			</RouterProvider>
		</BrowserRouter>
	);
}

export default Main;
```

## Commit Hooks & Code Quality

This project is set up to enforce best practices in code quality through:

- Husky: Git hooks to run checks before commits.
- Lint-staged: Runs linters and formatters on staged files.
- Commitlint: Ensures commit messages follow the conventional commit format.
- Prettier & ESLint: Automatic code formatting and linting.

## Configuration & Environment

Application settings are managed via several configuration files:

- API Configuration: src/config/api-config.ts defines endpoints and methods.
- Logger Configuration: src/config/logger.config.ts for log level settings.
- Date Formatting: src/config/dateFns.config.ts for date-related configurations.
- Toastr (Toast Notifications): src/config/toastr.config.ts for notification settings.
- Environment-specific configurations are loaded at runtime into the RUNTIME_APP_CONFIG object, ensuring flexibility and ease of deployment.

## Additional Information

### Internationalization (i18n):

The project uses i18next and react-i18next. Translation files are located in src/config/locales/.

### Custom Hooks & Utilities:

Various custom React hooks (e.g., useFocus, useIntersectionObserver, useSticky) and utility functions are provided under src/app/utils/hooks and src/app/utils/lib.

### Vite & Module Federation:

The project is built with Vite for fast builds and includes configuration for module federation if needed.
