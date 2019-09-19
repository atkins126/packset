// Link.js

import React from 'react';

import PacksetContext from '../PacksetContext/PacksetContext';

export default class Link extends React.Component {

  static contextType = PacksetContext;

  render() {
    let {href, ...others} = this.props;
    return <a href={this.context.resolveUrl(href)} {...others} />;
  }

}
