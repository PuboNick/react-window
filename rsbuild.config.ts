import { defineConfig } from '@rsbuild/core';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginReact } from '@rsbuild/plugin-react';

const ReactCompilerConfig = {
  /* ... */
};

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
      babelLoaderOptions(opts) {
        opts.plugins?.unshift('babel-plugin-react-compiler', ReactCompilerConfig);
      },
    }),
  ],
  html: {
    template: './index.html',
  },
  source: {
    entry: {
      index: './main.tsx',
    },
  },
});
