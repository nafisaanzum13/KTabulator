import React, { Component } from "react";

class FirstColSelection extends Component {

  constructor(props) {
    super(props);
    this.state = {};
    this.createFirstColSelection = this.createFirstColSelection.bind(this);
  }

  createFirstColSelection() {
    console.log(this.props.tableHeader);
    console.log(this.props.latestCheckedIndex);

    let returnEle = [];
    // We loop over the firstColSelection array, and push on the neede radio checkbox and textual information
    for (let i = 0; i < this.props.firstColSelection.length; ++i) {
      if (this.props.firstColSelection[i].pValue === "category") {
        returnEle.push(
          <div>
            <p>
              <input
                type="checkbox"
                checked={this.props.firstColChecked[i]}
                onChange={(e) => this.props.toggleNeighbourSelection(e, i)}
              />
              {'\u00A0'}{'\u00A0'}
              {niceRender(this.props.firstColSelection[i].oValue)}
            </p>
          </div>
        )
      }
      else {
        returnEle.push(
          <div>
            <p>
              <input
                type="checkbox"
                checked={this.props.firstColChecked[i]}
                onChange={(e) => this.props.toggleNeighbourSelection(e, i)}
              />
              {'\u00A0'}{'\u00A0'}
              {this.props.firstColSelection[i].pValue}
              {":"}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}
              {niceRender(this.props.firstColSelection[i].oValue)}
            </p>
          </div>
        )
      }
    }
    return returnEle;
  }

  render() {

    let selectionEle = this.createFirstColSelection();

    return (
      <div>
        <div>
          <p><b>Choose from attributes below</b> to determine the content for the first column</p>
        </div>
        <br />
        <div>
          {selectionEle}
        </div>
      </div>
    );
  }
}

export default FirstColSelection;

// This function renders this.props.tableData[i][j].data in a nicer way. 
// It removes all occurence of (...), and changes all "_" to " ".

function niceRender(str) {
  return str.replace(/_\(.*?\)/g, "")
            .replace(/_/g, " ");
}
