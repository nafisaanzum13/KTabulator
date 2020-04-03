import React, { Component } from "react";

class PagePanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pageHidden:false,
    }
    this.toggleWikiPage = this.toggleWikiPage.bind(this);
  }

  toggleWikiPage() {
    let pageHidden = this.state.pageHidden;
    if (pageHidden === false) {
      // in this case we are hiding the bottom part. Need to adjust the height for the botton part
      document.getElementsByClassName("bottom-content")[0].style.height = "4vh";
      document.getElementsByClassName("wiki-page")[0].style.height = "0vh";
      document.getElementsByClassName("wiki-page")[0].style.visibility = "hidden";
      document.getElementsByClassName("top-content")[0].style.height = "86vh";
      document.getElementsByClassName("table-panel")[0].style.height = "86vh";
      document.getElementsByClassName("action-panel")[0].style.height = "86vh";
    } else {
      document.getElementsByClassName("bottom-content")[0].style.height = "55vh";
      document.getElementsByClassName("wiki-page")[0].style.height = "55vh";
      document.getElementsByClassName("wiki-page")[0].style.visibility = "visible";
      document.getElementsByClassName("top-content")[0].style.height = "35vh";
      document.getElementsByClassName("table-panel")[0].style.height = "35vh";
      document.getElementsByClassName("action-panel")[0].style.height = "35vh";
    }
    this.setState({
      pageHidden:!pageHidden,
    })
  }

  render() {
    let pageEle = null;
    if (this.props.iframeURL !== "") {
      let buttonText = this.state.pageHidden?"Show Page":"Hide Page";
      pageEle = 
        <div className="row">
          <iframe id="iframe" title="URLPage" src={this.props.iframeURL} className="col-md-10 offset-md-1 wiki-page"></iframe>
          <button className="col-md-1 toggle-button" onClick={() => this.toggleWikiPage()}>{buttonText}</button>
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
