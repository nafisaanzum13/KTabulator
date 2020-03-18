import React, { Component } from "react";

class PagePanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  render() {
    let pageEle = null;
    if (this.props.urlPasted !== "") {
      pageEle = 
        <iframe title="URLPage" src={this.props.urlPasted} className="wiki-page col-md-10 offset-md-1"></iframe>
    }
    return (
      <div>
        {pageEle}
      </div>
    );
  }
}

export default PagePanel;
