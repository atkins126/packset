// Head.js

import React from 'react';
import ReactDOMServer from 'react-dom/server';

import PacksetContext from '../PacksetContext/PacksetContext';

export default class Head extends React.Component {

  static contextType = PacksetContext;

  serverSideRender() {
    if (!this.context.headRender) return;

    let title = null, base = null, others = null;
    let {children=[]} = this.props;
    if (!(children instanceof Array)) children = [children];
    for (let item of children) {
      if (!item) continue;
      let html = ReactDOMServer.renderToStaticMarkup(item);
      switch (item.type) {
        case 'title': title = html; break;
        case 'base': base = html; break;
        default: others = (others || '') + html; break;
      }
    }
    this.context.headRender({title, base, others});
  }

  clientSideRender() {
    if (typeof document === 'undefined') return;

    let {children=[]} = this.props;
    if (!(children instanceof Array)) children = [children];
    for (let item of children) {
      // only support title element in client side
      if (item && item.type === 'title') {
        let html = ReactDOMServer.renderToStaticMarkup(item);
        document.title = html.replace(/<title([^>]*)>(.*)<\/title>/, '$2');
      }
    }
  }

  render() {
    this.serverSideRender();
    this.clientSideRender();
    return false;
  }

}
