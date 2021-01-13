import React, { Component } from "react";
import Modal from 'react-modal';
import Select from "react-select";
import { Button } from "reactstrap";

class JoinModal extends Component {
  state = {};

  render() {

    // let optionsEle = [];

    // console.log(this.props.originColOptions);
    // console.log(this.props.joinColOptions);

    // Note, the props originColOptions and joinColOptions are what we are going to pass to react select as options

    // Support for join recommendation: in addition to letting users choose the join columns
    // we also want to make three suggestions or the three most joinable pairs, using a value-based approach

    return (
      <div>
        <Modal 
          isOpen={this.props.showJoin}
          className="join-modal"
        >
          <div className="container">
            <div className="row"> 
              <div className="col-md-5">
                Choose join column from table panel
              </div>
              <div className="offset-md-1 col-md-5">
                Choose join column from selected table
              </div>
            </div>
            <br />
            <div className="row">
              <Select
                className="col-md-5"
                value={this.props.originColOptions[this.props.originJoinIndex]}
                onChange={(e) => this.props.selectJoinColumn(e, "originTable")}
                placeholder={"Choose Join Column"}
                options={this.props.originColOptions}
                isMulti={false}
              />
              <Select
                className="offset-md-1 col-md-5"
                value={this.props.joinColOptions[this.props.joinJoinIndex]}
                onChange={(e) => this.props.selectJoinColumn(e, "joinTable")}
                placeholder={"Choose Join Column"}
                options={this.props.joinColOptions}
                isMulti={false}
              />
            </div>
            <br />
            <div className="row">
              <div className="col-md-1 offset-md-9">
                <Button onClick={(e) => this.props.runJoin(e)}>OK</Button>
              </div>
              <div className="col-md-2">
                <Button onClick={(e) => this.props.cancelJoin(e)}>Cancel</Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

export default JoinModal;
