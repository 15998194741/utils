const path = require('path')
module.exports = (env) => {
  return {
    mode: 'production',
    entry: './index.ts',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.json$/,
          type: 'asset/resource',
          generator: {
            filename: '[name][ext][query]'
          }
        }
      ]
    },
    plugins: [
    ],
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
      path: path.resolve(__dirname, 'webpack'),
      filename: '[name].[contenthash].bundle.js',
      libraryTarget: 'umd',
      clean: true,
      publicPath: '/',
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    },
  }

}
