import React, { Component } from "react";
import URLForm from "../components/URLForm";

class LandingPage extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  // In here we need to support both pasting of a URL and selection of a JSON file downloaded from website

  render() {
    return (
      <>
        <div className="landing-page">
          <div className="row">
            <div className="white-form col-md-5">
              <h1 className="text-center"> 
                Welcome!
              </h1>
              <hr className="header-hr"></hr>
              <h4 className="text-center">
                Enter the URL of a Wikipedia page to get started
              </h4>
              <URLForm 
                handleURLPaste={this.props.handleURLPaste} 
              />
              <br />
              <h4 className="offset-md-1">
                Or upload a downloaded table
              </h4>
              <div className="offset-md-4">
                <input 
                  type="file" 
                  onChange={this.props.handleFileChange}
                />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default LandingPage;
