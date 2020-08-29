import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

import pkg from './package.json';

const input = 'src/index.ts';
const extensions = ['.ts', '.tsx'];
const globals = {
  react: 'React',
  'react-dom': 'ReactDOM',
};
const external = Object.keys(globals);
const babelConfig = require('./babel.config');

const cjs = [
  {
    input,
    output: {
      file: `cjs/${pkg.fileName}.js`,
      sourcemap: true,
      format: 'cjs',
      esModule: false,
    },
    external,
    plugins: [
      peerDepsExternal(),
      babel({
        extensions,
        exclude: /node_modules/,
        sourceMaps: true,
        ...babelConfig,
      }),
      resolve({ extensions, browser: true }),
      commonjs(),
    ],
  },
  {
    input,
    output: {
      file: `cjs/${pkg.fileName}.min.js`,
      sourcemap: true,
      format: 'cjs',
    },
    external,
    plugins: [
      peerDepsExternal(),
      babel({
        extensions,
        exclude: /node_modules/,
        sourceMaps: true,
        ...babelConfig,
      }),
      resolve({ extensions, browser: true }),
      commonjs(),
      terser(),
    ],
  },
];

const esm = [
  {
    input,
    output: { file: `esm/${pkg.fileName}.js`, sourcemap: true, format: 'esm' },
    external,
    plugins: [
      peerDepsExternal(),
      resolve({ extensions, browser: true }),
      commonjs(),
      babel({
        extensions,
        exclude: /node_modules/,
        sourceMaps: true,
        babelHelpers: 'runtime',
        ...babelConfig,
        plugins: [
          ['@babel/transform-runtime', { useESModules: true }],
          ...babelConfig.plugins,
        ],
      }),
    ],
  },
];

const umd = [
  {
    input,
    output: {
      file: `umd/${pkg.fileName}.js`,
      name: 'ReactKeepAlive',
      sourcemap: true,
      format: 'umd',
      globals,
    },
    external,
    plugins: [
      peerDepsExternal(),
      babel({
        extensions,
        exclude: /node_modules/,
        sourceMaps: true,
        ...babelConfig,
      }),
      resolve({ extensions, browser: true }),
      commonjs(),
    ],
  },
  {
    input,
    output: {
      file: `umd/${pkg.fileName}.min.js`,
      name: 'ReactKeepAlive',
      format: 'umd',
      globals,
    },
    external,
    plugins: [
      peerDepsExternal(),
      babel({
        extensions,
        exclude: /node_modules/,
        sourceMaps: true,
        ...babelConfig,
      }),
      resolve({ extensions, browser: true }),
      commonjs(),
      terser(),
    ],
  },
];

export default [...cjs, ...esm, ...umd];
