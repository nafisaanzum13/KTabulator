import React, { Component } from "react";
import Modal from 'react-modal';

class FilterModal extends Component {
  state = {};

  render() {

    let optionsEle = [];
    for (let i=0;i<this.props.dataAndChecked.length;++i) {
      optionsEle.push(
        <div>
          <input
            type="checkbox"
            checked={this.props.dataAndChecked[i].checked}
            onChange={(e) => this.props.toggleChecked(e, i)}
          />
          {this.props.dataAndChecked[i].data}
        </div>
      )
    }
    // console.log(optionsEle);

    return (
      <div>
        <Modal 
          isOpen={this.props.showFilter}
          className="filter-modal"
        >
          <div className="container">
            <div>
              Here is the list of data to filter from selected column.
            </div>
            <br />
            <div className="checkbox-list">
              <div>
                <input
                  type="checkbox"
                  checked={this.props.checkAll}
                  onChange={(e) => this.props.toggleAll(e)}
                />
                Check/Uncheck all
              </div>
              <br />
              {optionsEle}
            </div>
            <br />
            <div className="row">
              <div className="col-md-1 offset-md-9">
                <button onClick={(e) => this.props.applyFilter(e)}>OK</button>
              </div>
              <div className="col-md-2">
                <button onClick={(e) => this.props.cancelFilter(e)}>Cancel</button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

export default FilterModal;
