const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/trustseal_frontend/src/index.tsx',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "buffer": false,
      "crypto": false,
      "stream": false,
      "util": false,
      "process": false
    }
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/trustseal_frontend/assets/index.html',
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.INTERNET_IDENTITY_CANISTER_ID': JSON.stringify(process.env.INTERNET_IDENTITY_CANISTER_ID || 'rdmx6-jaaaa-aaaaa-aaadq-cai'),
      'process.env.TRUSTSEAL_BACKEND_CANISTER_ID': JSON.stringify(process.env.TRUSTSEAL_BACKEND_CANISTER_ID || 'rrkah-fqaaa-aaaaa-aaaaq-cai')
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 3000,
  },
};
