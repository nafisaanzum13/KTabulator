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
    if (urlPasted === "") {
      return (
        <div className="row">
          <div className="col-md-6">
            <div contentEditable='true' 
              onPaste={this.handleURLPaste}
              suppressContentEditableWarning={true}>Paste the URL here</div>
          </div>
        </div>
      );
    }
    return (
      <div className="row">
        <div className="col-md-6">
          <div contentEditable='true' 
            onPaste={this.handleURLPaste} 
            suppressContentEditableWarning={true}>URL has already been pasted</div>
        </div>
      </div>
    );
  }
}
  
  export default URLForm;