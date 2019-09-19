// PacksetContextDefaultValue.js

export default {
  homepage: null, // string, equal to the homepage of package.json
  headRender: null, // ({title, base, others})
  resolveUrl: function(url) {
    let {homepage} = this;
    if (!url || /^(\w*:)?\/\//.test(url) || !homepage) return url;
    if (url.substr(0, 1) === '/' && homepage.substr(-1) === '/') {
      homepage = homepage.substr(0, homepage.length - 1);
    }      
    return homepage + url;
  }  
};
