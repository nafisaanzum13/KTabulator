import React, { Component } from "react";

class PagePanel extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    let pageEle = null;
    let wikiPageClass = "wiki-page-hidden";
    let buttonClass = "btn btn-sm btn-info toggle-button";
    if (this.props.iframeURL !== "") {
      let buttonhideShow = (
        <button
          className={buttonClass}
          onClick={() => this.props.toggleWikiPage()}
        >
          <i class="fa fa-chevron-up" aria-hidden="true"></i>
          Show
        </button>
      );
      if (!this.props.pageHidden) {
        wikiPageClass = "wiki-page";
        buttonhideShow = (
          <div>
            <hr className="m-1"></hr>
            <button
              className={buttonClass}
              onClick={() => this.props.toggleWikiPage()}
            >
              <i class="fa fa-chevron-down" aria-hidden="true"></i>
              Hide
            </button>
          </div>
        );
      }
      pageEle = (
        <div className="page-panel text-right">
          {buttonhideShow}
          <div className={wikiPageClass}>
            <iframe
              id="iframe"
              title="URLPage"
              src={this.props.iframeURL}
              className="iframe-cls"
            ></iframe>
          </div>
        </div>
      );
    }
    return <div>{pageEle}</div>;
  }
}

export default PagePanel;
