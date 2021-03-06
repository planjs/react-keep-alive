export default {
  bundler: 'rollup',
  esm: {
    runtimeHelpers: true,
  },
  cjs: true,
  umd: {
    minify: true,
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
  },
  target: 'browser',
  externalPeerDependenciesOnly: true,
  sourcemap: true,
};
