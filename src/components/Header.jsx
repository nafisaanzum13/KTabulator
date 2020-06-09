import React, { Component } from "react";
import { FaCopy, FaUndo, FaExchangeAlt } from "react-icons/fa";

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
          <div className="offset-md-2 col-md-2 row">
            <div className="col-md-4" title="copy table to csv">
              <FaCopy onClick={() => this.props.copyTable()}/>
            </div>
            <div className="col-md-4" title="go to table creation mode">
              <FaExchangeAlt onClick={() => this.props.goTableCreation()}/>
            </div>
            <div className="col-md-4" title="undo previous action">
              <FaUndo onClick={() => this.props.undoPreviousStep()}/>
            </div>
          </div>
        </div>
        <hr class="header-hr"></hr>
      </>
    );
  }
}

export default Header;
