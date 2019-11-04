// createPacksetApp.js

const fs = require('fs-extra');
const path = require('path');

if (process.argv.length < 3) {
  console.log('\nusage:\n  create-packset-app <project-directory>');
  return;
}

if (process.argv[2] === '-v' || process.argv[2] === '--version') {
  let version = require('../package.json').version;
  console.log(`\ncreate-packset-app v${version}`);
  return;
}

createPacksetApp(process.argv[2]);


function createPacksetApp(projectName) {
  let src = path.resolve(__dirname, '../templates/app');
  let dest = path.resolve(fs.realpathSync(process.cwd()), projectName);

  if (fs.existsSync(dest)) {
    console.log(`\n${projectName} directory exists`);
    return false;
  }
  fs.mkdirSync(dest, {recursive: true});

  let ignoreSet = {
    [`${src}/build`]: true,
    [`${src}/node_modules`]: true,
    [`${src}/yarn.lock`]: true,
  };
  fs.copySync(src, dest, {
    filter: file => !ignoreSet[file],
  });

  let packageJsonFile = `${dest}/package.json`;
  let packageJsonText = fs.readFileSync(packageJsonFile, 'utf8');
  packageJsonText = packageJsonText.replace(/"name":\s*".*"/, `"name": "${projectName}"`);
  fs.writeFileSync(packageJsonFile, packageJsonText, 'utf8');

  console.log(`\nproject ${projectName} has been created`);
}
