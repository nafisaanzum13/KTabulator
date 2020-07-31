import React, { Component } from "react";

class FirstColSelection extends Component {

  constructor(props) {
    super(props);
    this.state = {};
    this.createFirstColSelection = this.createFirstColSelection.bind(this);
  }

  createFirstColSelection() {
    // console.log(this.props.tableHeader);
    // console.log(this.props.latestCheckedIndex);

    let populateEle = null;

    // If tableHeader[0] is not empty, we have to create the populateText and populateEle
    if (this.props.latestCheckedIndex !== -1 && this.props.tableHeader[0].length > 0) {
      let populateText = "Populate first column with entities that";
      for (let i = 0; i < this.props.tableHeader[0].length; ++i) {
        let curText = i > 0 ? ", and" : "";
        if (this.props.tableHeader[0][i].pDataset === "dct") {
          curText = curText + " are " + niceRender(this.props.tableHeader[0][i].oValue);
        }
        else {
          curText = curText + " have " + this.props.tableHeader[0][i].pValue + "=" + niceRender(this.props.tableHeader[0][i].oValue);
        }
        populateText+=curText;
      }
      populateText+="?";
      populateEle = 
        <div>
          <p>
            <b>
              {populateText}
            </b>
            <button onClick={(e) => this.props.populateKeyColumn(e, 0, this.props.tableHeader[0])}>Okay</button>
          </p>
        </div>
    }

    let returnEle = [];
    // We loop over the firstColSelection array, and push on the neede radio checkbox and textual information
    for (let i = 0; i < this.props.firstColSelection.length; ++i) {
      // additionEle is basically a copy of populateEle
      let additionEle = i === this.props.latestCheckedIndex ? populateEle: null;
      if (this.props.firstColSelection[i].pValue === "category") {
        returnEle.push(
          <div>
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
            {additionEle}
          </div>
        )
      }
      else {
        returnEle.push(
          <div>
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
            {additionEle}
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
