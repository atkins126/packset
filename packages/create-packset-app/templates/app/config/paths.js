// paths.js
// reference create-react-app

const path = require('path');
const fs = require('fs');
const url = require('url');

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

const envPublicUrl = process.env.PUBLIC_URL;
const getPublicUrl = appPackageJson => envPublicUrl || require(appPackageJson).homepage;
const getServedPath = appPackageJson => {
  let publicUrl = getPublicUrl(appPackageJson);
  let servedUrl = envPublicUrl || (publicUrl ? url.parse(publicUrl).pathname : '/');
  if (servedUrl.substr(-1) !== '/') servedUrl += '/';
  return servedUrl;
};

module.exports = {
  appPath: resolveApp('.'),
  appSrc: resolveApp('src'),
  appPages: resolveApp('src/pages'),
  appBuild: resolveApp('build'),
  appPublic: resolveApp('public'),
  appHtml: resolveApp('public/index.html'),
  appPackageJson: resolveApp('package.json'),
  appNodeModules: resolveApp('node_modules'),
  publicUrl: getPublicUrl(resolveApp('package.json')),
  servedPath: getServedPath(resolveApp('package.json')),
};

