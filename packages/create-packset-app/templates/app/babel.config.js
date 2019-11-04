// babel.config.js
// Use babel.config.js to avoid conflicts between package.json/.babelrc and submodules

module.exports = {
  presets: [
    ['@babel/preset-env', {targets: {node: 'current'}}],
    '@babel/preset-react'
  ],
  plugins: [
    ['@babel/plugin-proposal-class-properties', {loose: true}],
    '@babel/plugin-transform-runtime',
    ['@babel/plugin-transform-destructuring', {loose: false}],
    ['@babel/plugin-proposal-object-rest-spread', {useBuiltIns: true}],
  ],
};
