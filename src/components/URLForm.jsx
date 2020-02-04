import React, { Component } from "react";

class URLForm extends Component {

  constructor(props) {
    super(props);
    this.handleURLPaste = this.handleURLPaste.bind(this);
  }

  handleURLPaste(e) {
    e.preventDefault();
    let urlPasted = (e.clipboardData || window.clipboardData).getData('text');
    this.props.onURLPaste(urlPasted);
  }

  render() {
    const urlPasted = this.props.urlPasted;
    let urlText;
    if (urlPasted === "") {
      urlText = "Paste the URL here";
    } else {
      urlText = "URL has already been pasted";
    }
    return (
      <div className="row">
        <div className="col-md-6">
          <div contentEditable='true' 
            onPaste={this.handleURLPaste} 
            suppressContentEditableWarning={true}>{urlText}</div>
        </div>
      </div>
    );
  }
}
  
  export default URLForm;