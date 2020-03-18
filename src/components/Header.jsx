import React, { Component } from "react";

class Header extends Component {
  state = {};
  render() {
    return (
      <>
        <div className="row header-body">
          <div className="col-md-8">
            <h1>Wiki Data Wrangler (Future Project v0.2)</h1>
          </div>
        </div>
        <hr></hr>
      </>
    );
  }
}

export default Header;
