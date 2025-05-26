# Eng Git CI

All'interno di questa directory sono presenti i file necessari per eseguire i flussi di lint commit e di release

## Dipendenze NPM

```
npm i @commitlint/cli @commitlint/config-conventional @release-it/conventional-changelog commitizen cz-conventional-changelog dotenv-cli husky release-it --save-dev
```

## File e cartelle

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

## Modifiche a file

### package.json

Aggiungere le seguenti parti

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
