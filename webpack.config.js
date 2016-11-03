/* eslint "import/no-extraneous-dependencies": ["error", {"devDependencies": true}] */
const { readdirSync } = require('fs');
const { join } = require('path');
const { BannerPlugin } = require('webpack');
const merge = require('webpack-merge');

const nodeModules = readdirSync('node_modules')
  .filter(x => [ '.bin' ].indexOf(x) === -1)
  .reduce((list, mod) => { list[mod] = `commonjs ${mod}`; return list; }, {});

const baseConfig = {
  context: join(__dirname, 'src'),

  entry: {
    launcher: './launcher.js',
  },

  output: {
    filename: '[name].js',
    path: join(__dirname, 'build'),
    libraryTarget: 'commonjs2',
  },

  module: {
    loaders: [
      // JavaScript
      {
        test: /\.js$/,
        include: join(__dirname, 'src'),
        loader: 'babel',
      },
    ],
  },

  target: 'node',
  externals: nodeModules,
};

switch (process.env.NODE_ENV) {
  case 'development':
    module.exports = merge(baseConfig, {
      devtool: 'inline-source-map',
      debug: true,

      plugins: [
        new BannerPlugin(
          '/* eslint-disable */\nrequire("source-map-support").install();',
          { raw: true, entryOnly: false }
        ),
      ],
    });
    break;
  default:
    module.exports = baseConfig;
}
