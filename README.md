# prop-hunt-scraper

## Description

A scraper for the PropHunt mobile app.

## Development

1. Install dependencies:

```
yarn
```

2. Add development and production Firebase service-accounts to `./service-account-development.json` and `./service-account-production.json`.

3. Watch ts files:

```
yarn build:watch
```

4. Run built files (in another terminal):

```
yarn nodemon ./build/src/main.js
```
