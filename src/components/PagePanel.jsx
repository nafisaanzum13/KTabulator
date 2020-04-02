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
      document.getElementsByClassName("top-content")[0].style.height = "86vh";
      document.getElementsByClassName("table-panel")[0].style.height = "86vh";
      document.getElementsByClassName("action-panel")[0].style.height = "86vh";
    } else {
      document.getElementsByClassName("bottom-content")[0].style.height = "45vh";
      document.getElementsByClassName("top-content")[0].style.height = "45vh";
      document.getElementsByClassName("table-panel")[0].style.height = "45vh";
      document.getElementsByClassName("action-panel")[0].style.height = "45vh";
    }
    this.setState({
      pageHidden:!pageHidden,
    })
  }

  render() {
    let pageEle = null;
    if (this.props.urlPasted !== "") {
      if (this.state.pageHidden === false) {
        pageEle = 
          <div className="row">
            <iframe title="URLPage" src={this.props.urlPasted} className="col-md-10 offset-md-1 wiki-page"></iframe>
            <button className="col-md-1 toggle-button" onClick={() => this.toggleWikiPage()}>Hide Page</button>
          </div>
      } else {
        pageEle = 
          <div className="row">
            <button className="offset-md-11 col-md-1 toggle-button" onClick={() => this.toggleWikiPage()}>Show Page</button>
          </div>
      }
    }
    return (
      <div>
        {pageEle}
      </div>
    );
  }
}

export default PagePanel;
