import React, { Component } from "react";

class URLForm extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.handleURLPaste = this.handleURLPaste.bind(this);
  }

  handleURLPaste(e) {
    e.preventDefault();
    let urlPasted = (e.clipboardData || window.clipboardData).getData("text");
    this.props.handleURLPaste(urlPasted);
  }

  render() {
    return (
      <div>
        <div className="row text-center">
          <div className="col-md-6 offset-md-3">
            <input
              placeholder="e.g., https://en.wikipedia.org/wiki/Canada"
              onPaste={this.handleURLPaste}
              className=" form-control"
            ></input>
          </div>
        </div>
      </div>
    );
  }
}

export default URLForm;
