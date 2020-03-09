// PacksetHelper.js

const fs = require('fs');
const path = require('path');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

// 忽略 React 页面中的样式资源文件
['.css', '.less', '.scss', '.sass'].map(ext => {
  require.extensions[ext] = () => {};
});
// 替换图片资源文件，将在编译完成后覆盖
['.bmp', '.gif', '.jpg', '.jpeg', '.png', '.svg'].map(ext => {
  require.extensions[ext] = (module, filename) => {
    module.exports = path.basename(filename);
  };
});

class PacksetHelper {

  constructor(paths) {
    this.paths = paths;
    this.pageSet = this.loadPageSet(this.paths.appPages);
    this.compiler = null;
    this.stats = null;
    this.imageSourceMap = {};
  }

  isValidUrlPath(urlPath) {
    return /^(\/|(\/([\w-])+)+)$/.test(urlPath);
  }

  matchEntryName(urlPath) {
    let result = null;

    let isMatch = (long, short) => {
      if (long.substr(-1, 1) !== '/') long += '/';
      if (short.substr(-1, 1) !== '/') short += '/';
      return long.substr(0, short.length) === short;
    };

    for (let entryName in this.pageSet) {
      let {entryPath} = this.pageSet[entryName];
      if (!isMatch(urlPath, entryPath)) continue;
      if (!result || entryPath.length > this.pageSet[result].entryPath.length) {
        result = entryName;
      }
    }

    return result;
  }

  matchEntryPath(urlPath) {
    let entryName = this.matchEntryName(urlPath);
    return (entryName ? this.pageSet[entryName].entryPath : null);
  }

  loadPageClass(sourcePath) {
    let Source = require(sourcePath);
    return Source && Source.default;
  }

  getWebpackEntry(urlPathList) {
    let result = {};
    if (urlPathList instanceof Array && urlPathList.length > 0) {
      for (let urlPath of urlPathList) {
        let entryName = this.matchEntryName(urlPath);
        result[entryName] = this.pageSet[entryName].sourcePath;
      }
    } else {
      for (let entryName in this.pageSet) {
        result[entryName] = this.pageSet[entryName].sourcePath;
      }
    }
    if (Object.keys(result).length === 0) return null;
    return result;
  }

  async buildUrlPath(urlPathList, callback) {
    let buildEntryUrlPath = async entryName => {
      let {sourcePath, entryPath} = this.pageSet[entryName];
      let PageClass = this.loadPageClass(sourcePath);
      if (PageClass && PageClass.packsetOptions.buildSubPath) {
        await PageClass.packsetOptions.buildSubPath(subPath => callback(entryPath + subPath));
      } else {
        await callback(entryPath);
      }      
    };

    if (urlPathList instanceof Array && urlPathList.length > 0) {
      for (let urlPath of urlPathList) {
        let entryName = this.matchEntryName(urlPath);
        let {entryPath} = this.pageSet[entryName];
        if (entryPath === urlPath) await buildEntryUrlPath(entryName);
        else await callback(urlPath);
      }
    } else {
      for (let entryName in this.pageSet) await buildEntryUrlPath(entryName);
    }
  }

  async getHtml(urlPath) {
    let entryName = this.matchEntryName(urlPath);
    let {entrypoints} = this.stats ? this.stats.toJson({source: false}) : {};
    if (!entryName || !entrypoints) return false;

    let tmplFileName = path.join(this.paths.appPublic, `${entryName}.html`);
    if (!fs.existsSync(tmplFileName)) tmplFileName = this.paths.appHtml;
    let html = fs.readFileSync(tmplFileName, 'utf8');
    
    let {publicPath} = this.compiler.options.output;
    let {PacksetContext} = require('packset');
    let packsetContextDefaultValue = require('packset/lib/PacksetContext/PacksetContextDefaultValue').default;
    let headRenderResult = {};
    let packsetContextProps = {value: {
      ...packsetContextDefaultValue,
      homepage: publicPath,
      headRender: result => headRenderResult = result,
    }};

    let PageClass = this.loadPageClass(this.pageSet[entryName].sourcePath);
    let props = PageClass.packsetOptions.getInitProps ? await PageClass.packsetOptions.getInitProps(urlPath) : null;
    let rootElement = React.createElement(PacksetContext.Provider, packsetContextProps, React.createElement(PageClass, props));
    let renderText = ReactDOMServer.renderToString(rootElement);
    let jsText = `<div id="root">${renderText}</div>\n`
      + (props ? `<script id="__PACKSET_DATA__" type="application/json">${JSON.stringify(props)}</script>\n` : '');
    let cssText = '';
    entrypoints[entryName].assets.map(item => {
      if (/\.js$/.test(item)) {
        jsText += `<script type="text/javascript" src="${publicPath}${item}"></script>\n`;
      } else if (/\.css$/.test(item)) {
        cssText += `<link rel="stylesheet" href="${publicPath}${item}" />\n`;
      }
    });
    html = html
      .replace(/\%PUBLIC_URL\%(\/)?/g, publicPath)
      .replace('<div id="root"></div>', jsText)
      .replace('</head>', cssText + '</head>');

    let {title, base, others} = headRenderResult;
    if (title || title === '') html = html.replace(/<title>(.*)<\/title>/, '').replace('</head>', title + '</head>');
    if (base || base === '') html = html.replace(/<base(.*)>/, '').replace('</head>', base + '</head>');
    if (others) html = html.replace('</head>', others + '</head>');

    return html;
  }

  setupHooks(compiler) {
    let packsetPageLoader = (path, data) => {
      for (let item of Object.values(this.pageSet)) {
        if (item.sourcePath === path) {
          let PageClass = this.loadPageClass(item.sourcePath);
          let PageClassName = PageClass.prototype.constructor.name;
          let text = `${data.toString()}\n`
            + `(function() {\n`
            + `  var React = require('react'), Packset = require('packset'), packsetContextDefaultValue = require('packset/lib/PacksetContext/PacksetContextDefaultValue').default;\n`
            + `  var packsetDataElement = global.document && global.document.getElementById('__PACKSET_DATA__');\n`
            + `  var packsetDataProps = packsetDataElement && JSON.parse(packsetDataElement.innerHTML);\n`
            + `  packsetContextDefaultValue.homepage = __webpack_public_path__;\n`
            + `  var packsetContextProps = {value: packsetContextDefaultValue};\n`
            + `  var packsetApp = React.createElement(Packset.PacksetContext.Provider, packsetContextProps, React.createElement(${PageClassName}, packsetDataProps));\n`
            + `  require('react-dom').hydrate(packsetApp, document.getElementById('root'));\n`
            + `})();`
          return Buffer.from(text);
        }
      }
      return data;
    };

    let isImageFile = filename => {
      for (let reg of [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.svg$/]) {
        if (reg.test(filename)) return true;
      }
      return false;
    };

    let getModuleUrl = compilationModule => {
      let src = `var __webpack_public_path__ = "${compiler.options.output.publicPath}";${compilationModule._source._value}`;
      let m = new module.constructor();
      m._compile(src, '');
      return m.exports;
    };

    let setupRequireExtensions = () => {
      // 清除源代码目录下的文件缓存
      Object.keys(require.cache).map(key => {
        if (key.substr(0, this.paths.appSrc.length) === this.paths.appSrc) {
          delete require.cache[key];
        }
      });
      // 替换图片资源文件
      ['.bmp', '.gif', '.jpg', '.jpeg', '.png', '.svg'].map(ext => {
        require.extensions[ext] = (module, filename) => {
          module.exports = this.imageSourceMap[filename];
        };
      });      
    }

    this.compiler = compiler;
    // 页面代码附件内容，此方法可以不需要自定义 babel-loader ，但属于非正常方式
    compiler.inputFileSystem.saveReadFile = compiler.inputFileSystem.readFile;
    compiler.inputFileSystem.readFile = (path, callback) => {
      compiler.inputFileSystem.saveReadFile(path, (err, data) => {
        if (!err) data = packsetPageLoader(path, data);
        callback(err, data);
      });
    }
    compiler.hooks.compilation.tap('packset-helper', compilation => {
      compilation.hooks.succeedModule.tap('packset-helper', module => {
        if (isImageFile(module.userRequest)) {
          this.imageSourceMap[module.userRequest] = getModuleUrl(module);
        }
      });
    });
    compiler.hooks.done.tap('packset-helper', stats => {
      this.stats = stats;
      setupRequireExtensions();
    });
  }

  loadPageSet(pagesPath) {

    //查找目录下所有js文件
    let findJsFile = path => {
      let list = [];
      for (let file of fs.readdirSync(path, {withFileTypes: true})) {
        if (file.isFile()) {
          if (/\.js$/.test(file.name)) list.push(path + file.name);
        } else if (file.isDirectory()) {
          list = list.concat(findJsFile(path + file.name + '/'));
        }
      }
      return list;
    };

    //路径转换为入口名
    let entryPath2Name = entryPath => {
      while (entryPath.substr(0, 1) === '/') entryPath = entryPath.substr(1);
      if (!entryPath) return 'index';
      return entryPath.replace(/\//gi, '$').toLowerCase();
    };

    if (pagesPath.substr(-1, 1) !== '/') pagesPath += '/';
    let jsFiles = findJsFile(pagesPath);
    let pageSet = {}, entrySet = {};
    for (let sourcePath of jsFiles) {
      let PageClass = this.loadPageClass(sourcePath);
      if (!PageClass || !PageClass.packsetOptions) continue; //不是页面文件
      let PageClassName = PageClass.prototype.constructor.name;
      if (!PageClass.packsetOptions.entryPath) throw `${PageClassName} from file "${sourcePath}" missing packsetOptions.entryPath property`;

      let entryPath = PageClass.packsetOptions.entryPath;
      if (!this.isValidUrlPath(entryPath)) throw `entryPath "${entryPath}" from "${sourcePath}" is invalid`;
      if (entrySet[entryPath]) throw `duplicate entryPath "${entryPath}" in "${entrySet[entryPath]}" and "${sourcePath}"`;

      let entryName = entryPath2Name(entryPath);
      if (entryName === 'static' || (entryName === 'index' && entryPath !== '/')) throw `entryPath "${entryPath}" from "${sourcePath}" is invalid, it can't be "/static" or "/index"`;

      entrySet[entryPath] = sourcePath;
      pageSet[entryName] = {
        sourcePath, // 源文件全路径，如 /path/to/file.js
        entryPath, // 入口路径，用于路由设置及静态页面存放起始路径，如 / 、 /page1 等 (相对路径 (path.relative('/foo/bar', '/') || '.') + '/')
        entryName, // 入口名字，用于 webpack entry 命名、页面 index/css 文件命名等，entryPath "/foo/bar" 会转换为 "foo$bar"
      };
    }

    return pageSet;
  }


}

module.exports = PacksetHelper;
