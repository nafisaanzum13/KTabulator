import React, { Component } from "react";
import Modal from 'react-modal';
import { Button } from "reactstrap";

// Note: this component is hard-coded and should be fixed.

class UnionModal extends Component {
  state = {};

  render() {

    return (
      <div>
        <Modal 
          isOpen={this.props.showUnionModal}
          className="union-modal"
        >
          <div className="container">
            <div className="row"> 
              <div className="col-md-5">
                Choose one of the following alignments:
              </div>
            </div>
            <br />
            <div className="modal-body">
              <div>
                <Button onClick={(e) => this.props.hardcodeUnion(e)}>Align 1</Button>
                <p>First Column---English title; director---Director(s); country---Country</p>
              </div>
              <div>
                <Button>Align 2</Button>
                <p>First Column---Original title; director---Director(s); country---Country</p>
              </div>
              <div>
                <Button>Align 3</Button>
                <p>First Column---Year; director---Director(s); country---Country</p>
              </div>
            </div>
            <div className="row">
              <div className="col-md-2 offset-md-10">
                <Button onClick={() => this.props.cancelUnionAlign()}>Cancel</Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

export default UnionModal;