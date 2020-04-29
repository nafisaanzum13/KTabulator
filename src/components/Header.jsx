import React, { Component } from "react";

class Header extends Component {
  state = {};
  render() {
    return (
      <>
        <div className="row header-body">
          <div className="col-md-8">
            <a href="index.html" class="logo">
              <b>
                <span>WikiData</span>Wrangler
              </b>
            </a>
          </div>
        </div>
        <hr class="header-hr"></hr>
      </>
    );
  }
}

export default Header;
