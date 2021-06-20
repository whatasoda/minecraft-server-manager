const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const root = path.resolve(__dirname, '../../');

/** @type {import('webpack').Configuration} */
module.exports = {
  entry: path.resolve(root, 'src/client/index.tsx'),
  output: {
    path: path.resolve(root, 'dist/public'),
    publicPath: '/',
  },
  devServer: {
    port: 8081,
    injectHot: false,
    writeToDisk: true,
  },
  plugins: [
    new CleanWebpackPlugin({ cleanAfterEveryBuildPatterns: ['!**/*'] }),
    new HtmlWebpackPlugin({
      template: path.resolve(root, 'src/client/template.html'),
    }),
  ],
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: { transpileOnly: true },
          },
        ],
      },
      {
        test: /\.s?css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }, { loader: 'sass-loader' }],
      },
    ],
  },
};
