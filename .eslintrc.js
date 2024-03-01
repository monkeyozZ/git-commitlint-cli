module.exports = {
  "extends": [
    "airbnb-base",
    "plugin:node/recommended",
    "plugin:promise/recommended",
    "plugin:standard/recommended"
  ],
  "env": {
    "browser": true,
    "node": true,
    "es6": true
  },
  "parserOptions": {
    "ecmaVersion": 2018
  },
  "rules": {
    "no-console": "off",
    "no-debugger": "off"
  }
}