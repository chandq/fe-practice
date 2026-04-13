const { resolve } = require('path');
module.exports = {
  mode: 'development',

  entry: resolve('./src/index.js'),
  output: {
    path: resolve('./dist'),
    filename: 'index.js'
  },
  module: {
    rules: [
      {
        test: /\.(e|j)s$/,
        exclude: /(node_modules|bower_components)/,
        use: 'babel-loader'
      }
    ]
  }
};
