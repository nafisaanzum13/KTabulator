import React, { Component } from "react";

class URLForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
    }
    this.handleURLPaste = this.handleURLPaste.bind(this);
  }

  handleURLPaste(e) {
    e.preventDefault();
    let urlPasted = (e.clipboardData || window.clipboardData).getData('text');
    this.props.handleURLPaste(urlPasted);
  }

  render() {
    return (
      <div>
        <input 
          placeholder={"Paste URL here to get started"} 
          onPaste={this.handleURLPaste}
          className="col-md-8">
        </input>
      </div>
    );
  }
}

export default URLForm;