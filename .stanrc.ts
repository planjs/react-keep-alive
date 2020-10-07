export default {
  bundle: 'rollup',
  esm: {
    runtimeHelpers: true,
  },
  cjs: {
    minify: true,
  },
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
