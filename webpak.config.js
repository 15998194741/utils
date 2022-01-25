const path = require('path');
console.log("开始打包")
/**
 * @type {import('webpack').configFile}
 */
module.exports = {
  resolve: {
    extensions: ['.js', '.ts', '.json'],
  },
  devtool: 'source-map',// 打包出的js文件是否生成map文件（方便浏览器调试）
  mode: 'production',
  entry: './index.ts',
  output: {
    filename: '[name].js',// 生成的fiename需要与package.json中的main一致
    path: path.resolve(__dirname, 'bu'),
    libraryTarget: 'commonjs',
  },
  build: {
    entry: './index.ts',
  },
  // module: {
  //   rules: [
  //     {
  //       test: /\.tsx?$/,
  //       use: [
  //         {
  //           loader: 'ts-loader',
  //           options: {
  //             // 指定特定的ts编译配置，为了区分脚本的ts配置
  //             configFile: path.resolve(__dirname, './tsconfig.json'),
  //           },
  //         },
  //       ],
  //       exclude: /node_modules/,
  //     },
  //   ],
  // },
};
