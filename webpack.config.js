const path = require('path')

module.exports = {
  entry: {
    normalize: path.resolve(__dirname, 'src/index.js')
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    rules: [{
      test: /\.js$/,
      use: [
        {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      ],
      exclude: path.resolve(__dirname, 'node_modules/')
    }]
  }
}
