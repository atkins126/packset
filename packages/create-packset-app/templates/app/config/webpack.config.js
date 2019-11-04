// webpack.config.js

const path = require('path');
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const paths = require('./paths');

process.env.NODE_PATH = (process.env.NODE_PATH || paths.appSrc);
require('module').Module._initPaths();

module.exports = function(webpackEnv, entry) {

  const isEnvDevelopment = webpackEnv === 'development';
  const isEnvProduction = webpackEnv === 'production';
  const publicPath = isEnvDevelopment ? '/' : paths.servedPath;

  return {
    mode: isEnvProduction ? 'production' : isEnvDevelopment && 'development', // 'production' | 'development' | 'none'
    entry,
    output: {
      path: paths.appBuild,
      filename: isEnvProduction ? 'static/js/[name].[chunkhash:8].js' : isEnvDevelopment && 'static/js/[name].bundle.js',
      chunkFilename: isEnvProduction ? 'static/js/[name].[chunkhash:8].chunk.js' : isEnvDevelopment && 'static/js/[name].chunk.js',
      publicPath,
    },
    module: {
      rules: [
        {
          test: /\.(js|mjs|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {useBuiltIns: 'entry', corejs: 3, modules: false}],
                '@babel/preset-react'
              ],
              plugins: [
                ['@babel/plugin-proposal-class-properties', {loose: true}],
                '@babel/plugin-transform-runtime',
                ['@babel/plugin-transform-destructuring', {loose: false}],
                ['@babel/plugin-proposal-object-rest-spread', {useBuiltIns: true}],
                ['import', {'libraryName': 'antd', 'libraryDirectory': 'es', 'style': 'css'}],
              ]
            }
          }
        }, {
          oneOf: [{
            test: /\.css$/,
            use: [
              isEnvDevelopment && 'style-loader',
              isEnvProduction && MiniCssExtractPlugin.loader,
              'css-loader'
            ].filter(Boolean),
            sideEffects: true,
          }, {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.svg$/],
            loader: 'url-loader',
            options: {
              limit: 10000,
              name: 'static/media/[name].[hash:8].[ext]',
            },
          }, {
            loader: 'file-loader',
            exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
            options: {
              name: 'static/media/[name].[hash:8].[ext]',
            },
          }]
        }
      ]
    },
    resolve: {
      modules: [
        'node_modules',
      ].concat((process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean)),
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'static/css/[name].[contenthash:8].css',
      }),
      new webpack.HashedModuleIdsPlugin(),
      isEnvDevelopment && new webpack.HotModuleReplacementPlugin(),
    ].filter(Boolean),
    optimization: {
      namedModules: true,
      namedChunks: true,
      splitChunks: {
        cacheGroups: {
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'vendor-react',
            chunks: 'all',
          },
          corejs: {
            test: /[\\/]node_modules[\\/](core-js)[\\/]/,
            name: 'vendor-corejs',
            chunks: 'all',
          },
        }
      }
    },
  };
}
