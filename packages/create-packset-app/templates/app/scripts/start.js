// start.js

const path = require('path');
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server');

const paths = require('../config/paths');
const webpackConfigFactory = require('../config/webpack.config');
const PacksetHelper = require('./PacksetHelper');

const packsetHelper = new PacksetHelper(paths);
const webpackConfig = webpackConfigFactory('development', packsetHelper.getWebpackEntry());
const compiler = webpack(webpackConfig);

packsetHelper.setupHooks(compiler);

const serverConfig = {
  compress: true,
  contentBase: paths.appPublic,
  watchContentBase: true,
  hot: true,
  inline:true,
  progress:true,
  historyApiFallback: true, //接管所有目录请求
  before: function(app, server) {
    app.get('*', (req, res, next) => {
      let entryPath = packsetHelper.matchEntryPath(req.originalUrl);
      if (entryPath !== '/' || entryPath === req.originalUrl) {
        packsetHelper.getHtml(req.originalUrl).then(html => {
          if (html) {
            res.set('content-type', 'text/html');
            res.send(html);
            res.end();            
          } else {
            next();
          }
        });
      } else {
        next();
      }
    });
  }
};

const devServer = new WebpackDevServer(compiler, serverConfig);
devServer.listen(3001, '0.0.0.0', err => {
  if (err) return console.log(err);
  console.log('Starting the development server...\n');
});
