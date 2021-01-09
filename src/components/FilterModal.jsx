import React, { Component } from "react";
import Modal from 'react-modal';
import { Button } from "reactstrap";

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
          {niceRender(this.props.dataAndChecked[i].data)}
        </div>
      )
    }
    // console.log(optionsEle);

    // Support for range filter starts here:
    // If we have detected that this is a numeric column, we need to display an additional element here
    // We first loop through this column to determine if it's a numeric column or a string column
    let rangeEle = null;

    if (this.props.showFilter === true) {
      let numericCol = true;
      for (let i = 0; i < this.props.tableData.length; ++i) {
        // We only care about entries that are not N/A
        if (this.props.tableData[i][this.props.curFilterIndex].data !== "N/A") {
          if (isNaN(Number(this.props.tableData[i][this.props.curFilterIndex].data))) {
            numericCol = false;
            break;
          }
        }
      }
      // console.log("a numeric column? "+numericCol);
      
      // If this is a numeric column, we need to allow users to input two fields:
      // min and max
      if (numericCol) {
        rangeEle = 
          <div>
            <p>
              <input
                placeholder="min"
                value={this.props.filterMin}
                onChange={(e) => this.props.handleRangeFilter(e, "min")}
              ></input>
              to
              <input
                placeholder="max"
                value={this.props.filterMax}
                onChange={(e) => this.props.handleRangeFilter(e, "max")}
              ></input>
            </p>
          </div>
      }
    }

    return (
      <div>
        <Modal 
          isOpen={this.props.showFilter}
          className="filter-modal"
        >
          <div className="container">
            <div>
              Here is the list of data to filter.
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
              {rangeEle}
              {optionsEle}
            </div>
            <br />
            <div className="row">
              <div className="col-md-1 offset-md-9">
                <Button onClick={(e) => this.props.applyFilter(e)}>OK</Button>
              </div>
              <div className="col-md-2">
                <Button onClick={(e) => this.props.cancelFilter(e)}>Cancel</Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

export default FilterModal;

// This function renders data in a nicer way. 
// It removes all occurence of (...), and changes all "_" to " ".

function niceRender(str) {
  return str.replace(/_\(.*?\)/g, "")
            .replace(/_/g, " ");
}
