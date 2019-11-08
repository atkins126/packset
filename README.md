# Packset

### Usage
Creating a packset app:
```
yarn create packset-app my-app
cd my-app
yarn
```

Runs the app in development mode:
```
yarn start
```

Builds the app for production to the build folder:
```
yarn build
```

### Incremental builds
You can use `yarn build [urlPath] [...]` to build only the pages you need:
```
yarn build /content/1 /content/2 /content/3
```
