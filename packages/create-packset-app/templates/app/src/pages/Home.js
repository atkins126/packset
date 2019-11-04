// Home.js

import React from 'react';

import {Head} from 'packset';

export default class Home extends React.Component {

  static packsetOptions = {
    entryPath: '/', // required, can't be "static" or "index"
    getInitProps: async urlPath => null, // get props by urlPath, there is no default props when it's undefined or null
    buildSubPath: callback => callback(''), // generate all subpaths, no subpaths when it's undefined or null
  };

  render() {
    return (
      <div>
        <Head><title>Packset App</title></Head>
        <p>It's work</p>
      </div>
    );
  }

}


