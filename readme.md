# Simple script to bump version in monorepo

## Usage

```bash
yarn add phuc-bump-version -D
```


## Usage

```bash
# patch version
bump-version 

# minor version
bump-version --minor

# major version
bump-version --major
```

## Features

- [x] bump version in package.json
- [x] bump version in workspaces's package.json
- [ ] Revert version if bump fails
