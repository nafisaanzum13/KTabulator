import React, { Component } from "react";
import Modal from 'react-modal';
// The two following lines are for range sliders
import RangeSlider from "react-bootstrap-range-slider";
import "react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css";

class SettingModal extends Component {
  state = {};
  render() {
    return (
      <div>
        <Modal 
          isOpen={this.props.showSetting}
          className="setting-modal"
        >
          <div className="container">
            <div className="row">
              <div className="col-md-6 offset-md-3">
                <h4>Table Union Search Settings</h4>
              </div>
            </div>
            <br />
            {/* <div className="row">
              <div className="col-md-4">Semantic Mapping:</div>
              <div className="col-md-6">
                <div onChange={(e) => this.props.toggleSemantic(e)}>
                  <input
                  type="radio"
                  value="enabled"
                  checked={this.props.semanticEnabled === "enabled"}
                  />{" "}
                  Enabled
                  <input
                    type="radio"
                    value="disabled"
                    checked={this.props.semanticEnabled === "disabled"}
                  />{" "}
                  Disabled
                </div>
              </div>
            </div> */}
            <br />
            <div className="row">
              <div className="col-md-4">Percentage of Columns to Union:</div>
              <div className="col-md-6">
                <RangeSlider
                  value={this.props.unionCutOff}
                  onChange={(e) => this.props.unionCutOffChange(e)}
                  min={0}
                  max={1}
                  step={0.05}
                />
              </div>
            </div>
            <br />
            <div className="row">
              <div className="col-md-4 offset-md-4">
                <button onClick={() => this.props.closeModal()}>Confirm Settings</button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

export default SettingModal;
