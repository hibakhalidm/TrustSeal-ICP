const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/trustseal_frontend/src/index.tsx',
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    clean: true,
    publicPath: '/'
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx']
  },

  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        type: 'asset/resource'
      }
    ]
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './src/trustseal_frontend/assets/index.html',
      title: 'TrustSeal Hedera'
    })
  ],

  devServer: {
    static: {
      directory: path.join(__dirname, 'dist')
    },
    compress: true,
    port: 8080,
    historyApiFallback: true,
    open: true
  },

  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  }
};