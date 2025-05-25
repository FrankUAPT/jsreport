const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development', // Can be 'production' for production builds
  entry: './src/index.js', // Entry point of your React app
  target: 'electron-renderer', // Important for Electron apps
  output: {
    path: path.resolve(__dirname, 'dist'), // Output directory
    filename: 'bundle.js', // Output bundle file name
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'], // Example for CSS handling
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html', // Use existing index.html as template
      filename: 'index.html', // Output HTML file name (can be the same)
      inject: 'body', // Inject scripts into the body
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx'], // Allow importing .js and .jsx without specifying extension
  },
};
