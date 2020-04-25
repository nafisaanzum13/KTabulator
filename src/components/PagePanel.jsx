import React, { Component } from "react";

class PagePanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  render() {
    let pageEle = null;
    if (this.props.iframeURL !== "") {
      let buttonText = this.props.pageHidden?"Show Page":"Hide Page";
      pageEle = 
        <div className="row">
          <iframe id="iframe" title="URLPage" src={this.props.iframeURL} className="col-md-10 offset-md-1 wiki-page"></iframe>
          <button className="col-md-1 toggle-button" onClick={() => this.props.toggleWikiPage()}>{buttonText}</button>
        </div>
    }
    return (
      <div>
        {pageEle}
      </div>
    );
  }
}

export default PagePanel;
