# Eng Git CI

Inside this directory are the files necessary to execute the commit lint and release flows.

## NPM Dependencies

```
npm i @commitlint/cli @commitlint/config-conventional @release-it/conventional-changelog commitizen cz-conventional-changelog dotenv-cli husky release-it --save-dev
```

## Files and Folders

### .husky/commit-msg

```sh
#!/bin/sh
. "$(dirname $0)/_/husky.sh"

npx --no-install commitlint --edit $1

```

### .husky/pre-commit

```sh
#!/bin/sh
. "$(dirname $0)/_/husky.sh"

npm run lint

```

### .husky/prepare-commit-msg

```sh
#!/bin/sh
. "$(dirname $0)/_/husky.sh"

if [ "$OSTYPE" == "win32" ] || [ "$OSTYPE" == "msys" ];
then
  npm run prepare-commit-msg-win
else
  npm run prepare-commit-msg-unix
fi
```

## File Modifications

### package.json

Add the following parts

```json
{
	"scripts": {
		"prepare-commit-msg-unix": "exec < /dev/tty && git cz --hook || true",
		"prepare-commit-msg-win": "utils/commit/utils/prepare-commit-msg",
		"release:dev": "dotenv release-it -- --config ./utils/release/.release-it.js --disable-metrics --ci",
		"postinstall": "husky install"
	},
	"config": {
		"commitizen": {
			"path": "./node_modules/cz-conventional-changelog"
		}
	},
	"commitlint": {
		"extends": ["@commitlint/config-conventional"]
	}
}
```
