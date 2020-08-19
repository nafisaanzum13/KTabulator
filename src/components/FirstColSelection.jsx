import React, { Component } from "react";
import { Button } from "reactstrap";

class FirstColSelection extends Component {

  constructor(props) {
    super(props);
    this.state = {};
    this.createFirstColSelection = this.createFirstColSelection.bind(this);
  }

  createFirstColSelection() {
    let keyCheckedIndex = this.props.keyCheckedIndex;
    let firstColSelection = this.props.firstColSelection;
    let firstColChecked = this.props.firstColChecked;

    let populateEle = null;

    let selectedNeighbours = [];
    // We will create the selectedNeighbours array from this.props.firstColSelection and this.props.firstColChecked
    if (firstColChecked.length !== firstColSelection.length) {
      alert("Some error exists");
    }
    for (let i = 0; i < firstColChecked.length; ++i) {
      if (firstColChecked[i] === true) {
        selectedNeighbours.push(firstColSelection[i]);
      }
    }

    // console.log(selectedNeighbours);

    // If selectedNeighbours is not empty, we have to create the populateText and populateEle
    if (keyCheckedIndex !== -1 && selectedNeighbours.length > 0) {
      let populateText = 
        this.props.firstColFilled === false ? "Populate first column with entities that"
        : "Add to first column with entities that";
      for (let i = 0; i < selectedNeighbours.length; ++i) {
        let curText = i > 0 ? ", and" : "";
        if (selectedNeighbours[i].pDataset === "dct") {
          curText = curText + " are " + niceRender(selectedNeighbours[i].oValue);
        }
        else {
          curText = curText + " have " + selectedNeighbours[i].pValue + "=" + niceRender(selectedNeighbours[i].oValue);
        }
        populateText+=curText;
      }
      populateText+="?";
      // We conditionally create the button element
      // If firstColFilled is false, we want to run populateKeyColumn
      // Otherwise, we want to run addKeyColumn
      let buttonEle = 
        this.props.firstColFilled === false ? <Button onClick={(e) => this.props.populateKeyColumn(e, 0, selectedNeighbours)}>OK</Button>
        : <Button onClick={(e) => this.props.confirmAddFirstCol(e, selectedNeighbours)}>OK</Button>;
      populateEle = 
        <div>
          <div><b>{populateText}</b></div>
          {buttonEle}
        </div>
    }

    let returnEle = [];
    // We loop over the firstColSelection array, and push on the needed radio checkbox and textual information
    for (let i = 0; i < firstColSelection.length; ++i) {
      // additionEle is basically a copy of populateEle
      let additionEle = i === keyCheckedIndex ? populateEle: null;
      if (firstColSelection[i].pValue === "category") {
        returnEle.push(
          <div>
            <div>
              <p>
                <input
                  type="checkbox"
                  checked={firstColChecked[i]}
                  onChange={(e) => this.props.toggleFirstNeighbour(e, i)}
                />
                {'\u00A0'}{'\u00A0'}
                {niceRender(firstColSelection[i].oValue)}
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
                  checked={firstColChecked[i]}
                  onChange={(e) => this.props.toggleFirstNeighbour(e, i)}
                />
                {'\u00A0'}{'\u00A0'}
                {firstColSelection[i].pValue}
                {":"}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}
                {niceRender(firstColSelection[i].oValue)}
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
