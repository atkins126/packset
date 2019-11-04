// build.js

const fs = require('fs-extra');
const path = require('path');
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server');

const paths = require('../config/paths');
const webpackConfigFactory = require('../config/webpack.config');
const PacksetHelper = require('./PacksetHelper');

let urlPathList = process.argv.length > 2 ? process.argv.slice(2) : null;
build(urlPathList).catch(err => {
  console.log('ERROR:', err);
});

async function build(urlPathList) {

  return new Promise(async (resolve, reject) => {
    try {
      const packsetHelper = new PacksetHelper(paths);
      for (let urlPath of urlPathList || []) {
        if (!packsetHelper.isValidUrlPath(urlPath)) {
          return reject(new Error(`invalid urlPath: ${urlPath}`));
        }
      }

      const webpackEntry = packsetHelper.getWebpackEntry(urlPathList);
      const webpackConfig = webpackConfigFactory('production', webpackEntry);
      const compiler = webpack(webpackConfig);

      packsetHelper.setupHooks(compiler);

      copyPublicFolder(webpackEntry);
      let {err, stats} = await run(compiler);
      if (err) return reject(err);
      let statsJson = stats.toJson({ all: false, warnings: true, errors: true });
      if (statsJson.errors.length > 0) {
        return reject(new Error(statsJson.errors.join('\n\n')));
      }
      if (statsJson.warnings.length > 0) {
      }

      packsetHelper.buildUrlPath(urlPathList, async urlPath => {
        saveHtmlFile(urlPath, await packsetHelper.getHtml(urlPath));
      });
    } catch (err) {
      return reject(err);
    }
  });
}

function copyPublicFolder(webpackEntry) {
  let appHtmlSet = {};
  Object.keys(webpackEntry).map(entryName => {
    appHtmlSet[path.join(paths.appPublic, `${entryName}.html`)] = true;
  });
  fs.copySync(paths.appPublic, paths.appBuild, {
    dereference: true,
    filter: file => !appHtmlSet[file],
  });
}

async function run(compiler) {
  return new Promise((resolve, reject) => {
    compiler.run(async (err, stats) => resolve({err, stats}));
  });
}

function saveHtmlFile(urlPath, html) {
  let dir = path.join(paths.appBuild, urlPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}
