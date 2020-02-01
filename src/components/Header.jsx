import React, { Component } from "react";
class Header extends Component {
  state = {};
  render() {
    return (
      <>
        <div className="row header-body">
          <div className="col-md-6">
            <h1>Wiki Data Wrangler</h1>
          </div>
          <div className="col-md-6"></div>
        </div>
        <hr></hr>
      </>
    );
  }
}

export default Header;
