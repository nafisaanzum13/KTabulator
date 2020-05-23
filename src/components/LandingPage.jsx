import React, { Component } from "react";
import URLForm from "../components/URLForm";

class LandingPage extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <>
        <div class="landing-page">
          <div class=" row text-center">
            <div class="white-form col-md-5">
              <h1 class=""> Welcome!</h1>
              <hr className="header-hr"></hr>
              <h4>Enter the URL of a Wikipedia page and start wrangling!</h4>
              <URLForm handleURLPaste={this.props.handleURLPaste} />
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default LandingPage;
