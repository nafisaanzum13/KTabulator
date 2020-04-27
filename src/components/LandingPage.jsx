import React, { Component } from "react";
import URLForm from "../components/URLForm";

class LandingPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  render() {
    return (
      <div>
        <h3>Welcome to WikiData Wrangler!</h3>
        <URLForm 
          handleURLPaste={this.props.handleURLPaste}
        />
      </div>
    );
  }
}

export default LandingPage;