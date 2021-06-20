const webpack = require('webpack');
const { default: merge } = require('webpack-merge');
const TerserWebpackPlugin = require('terser-webpack-plugin');

/** @type {import('webpack').Configuration} */
const config = {
  mode: 'production',
  devtool: 'source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
      },
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
    minimize: true,
    minimizer: [
      new TerserWebpackPlugin({
        terserOptions: {
          compress: {},
          output: {
            comments: false,
          },
        },
      }),
    ],
  },
};

module.exports = merge(require('./config.base'), config);
