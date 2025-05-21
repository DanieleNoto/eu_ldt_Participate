# End-to-End Tests with Playwright

This directory contains end-to-end (E2E) tests for the EU LDT Use Cases and Scenarios project. These tests are written using [Playwright](https://playwright.dev/).

## Setup

1. Install the project dependencies:
    ```sh
    npm install
    ```

## Running Tests

To run the E2E tests, use the following command:

```sh
"scripts": {
    "test": "playwright test",
    "test-ui": "playwright test --ui",
    "test-ui-port0": "playwright test --ui-port=0",
    "report": "playwright show-report"
},
```

## Writing Tests

Tests are located in the `tests/acceptance/e2e` directory. You can add new test files following the existing structure. Refer to the [Playwright documentation](https://playwright.dev/docs/intro) for more details on writing tests.

## Directory Structure

```
/tests/acceptance/e2e
  ├── tests
  │   ├── example.spec.js
  │   └── ...
  ├── README.md
  └── ...
```

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
