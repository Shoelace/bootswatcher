
#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const config = `/** @type {import('webpack').Configuration} */
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/BootSwatcher.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'BootSwatcher.bundle.js',
    module: true,
    library: { type: 'module' },
    environment: { module: true },
  },
  experiments: { outputModule: true },
  resolve: { extensions: ['.ts', '.js'] },
  module: {
    rules: [ { test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ } ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'index.prod.html', to: 'index.html' },
        { from: 'themes', to: 'themes' },
        { from: 'vendor', to: 'vendor' },
      ],
    }),
  ],
};
`;

async function main() {
  const file = path.join(ROOT, 'webpack.config.js');
  await fs.writeFile(file, config);
  console.log('Wrote webpack.config.js');
  console.log('Install bundler dev deps: pnpm add -D webpack webpack-cli copy-webpack-plugin ts-loader');
  console.log('Run: pnpm webpack');
}

main().catch(console.error);
