import React, { Component } from "react";
import Modal from 'react-modal';
import Select from "react-select";
import { Button } from "reactstrap";

class JoinModal extends Component {
  state = {};

  render() {

    // Support for join recommendation: in addition to letting users choose the join columns
    // we also want to make three suggestions or the three most joinable pairs, using a value-based approach

    console.log(this.props.originColOptions);
    console.log(this.props.joinColOptions);

    let joinPairEle = null;
    let joinPairArray = []
    if (this.props.joinPairRecord.length > 0) {
      for (let i = 0; i < this.props.joinPairRecord.length; ++i) {
        let originIndex = this.props.joinPairRecord[i]["indices"][0];
        let joinIndex = this.props.joinPairRecord[i]["indices"][1];
        let originCol = this.props.originColOptions[originIndex].label;
        let joinCol = this.props.joinColOptions[joinIndex].label;
        let buttonText = originCol + " with " + joinCol;
        joinPairArray.push(
          <p>
            <Button
              onClick={(e) => this.props.runJoin(e, "suggest", originIndex, joinIndex)}
            >
              {buttonText}
            </Button>
          </p>
        )
      }
      joinPairEle = 
        <div>
          <p>
            Here are the suggested columns to join on.
          </p>
          {joinPairArray}
        </div>
    }

    return (
      <div>
        <Modal 
          isOpen={this.props.showJoin}
          className="join-modal"
        >
          <div className="container">
            {joinPairEle}
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
                <Button onClick={(e) => this.props.runJoin(e, "custom")}>OK</Button>
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
