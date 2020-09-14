import React, { Component } from "react";
import { FaCopy, FaUndo } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";

class Header extends Component {
  state = {};
  render() {
    return (
      <>
        <div className="row header-body">
          <div className="col-md-8">
            <a href="index.html" class="logo">
              <b>
                <span>K</span>Tabulator
              </b>
            </a>
          </div>
          <div className="offset-md-2 col-md-2 row">
            <div className="col-md-4">
              <button
                className="btn btn-default"
                title="export table"
                onClick={() => this.props.copyTable()}
              >
                <FaCopy className="logo-left-color" />
              </button>
            </div>
            <div className="col-md-4">
              <button
                className="btn btn-default"
                title="Union Table Settings"
              >
                <FiSettings
                  className="logo-left-color"
                  onClick={() => this.props.openModal()}
                />
              </button>
            </div>
            <div className="col-md-4">
              <button
                className="btn btn-default"
                title="undo previous action"
                onClick={() => this.props.undoPreviousStep()}
              >
                <FaUndo className="color-wrangler" />
              </button>
            </div>
          </div>
        </div>
        <hr class="header-hr"></hr>
      </>
    );
  }
}

export default Header;
