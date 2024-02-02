// https://jestjs.io/es-ES/docs/getting-started#usando-typescript
module.exports = {
  presets: [
    ['@babel/preset-env', {targets: {node: 'current'}}],
    '@babel/preset-typescript',
  ],
}