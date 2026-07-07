module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    overrides: [
      {
        // TypeScript files in node_modules need the TS transform BEFORE class props
        test: /node_modules\/.*\.tsx?$/,
        plugins: [
          ['@babel/plugin-transform-typescript', { isTSX: true, allExtensions: true }],
          ['@babel/plugin-transform-class-properties', { loose: false }],
          ['@babel/plugin-transform-private-methods', { loose: false }],
          ['@babel/plugin-transform-private-property-in-object', { loose: false }]
        ]
      },
      {
        // JS files in node_modules only need class prop transforms (no TS transform!)
        // React Native uses Flow, NOT TypeScript — the TS plugin would corrupt Flow annotations
        test: /node_modules\/.*\.jsx?$/,
        plugins: [
          ['@babel/plugin-transform-class-properties', { loose: false }],
          ['@babel/plugin-transform-private-methods', { loose: false }],
          ['@babel/plugin-transform-private-property-in-object', { loose: false }]
        ]
      }
    ]
  };
};
