const webpack = require('webpack');
const { default: merge } = require('webpack-merge');

/** @type {import('webpack').Configuration} */
const config = {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
      },
    }),
  ],
};

module.exports = merge(require('./config.base'), config);
