import React, { Component } from "react";

class OtherColSelection extends Component {

  constructor(props) {
    super(props);
    this.state = {};
    this.createOtherColSelection = this.createOtherColSelection.bind(this);
  }

  createOtherColSelection() {
    let otherColSelection = this.props.otherColSelection;
    let otherColChecked = this.props.otherColChecked;
    let otherCheckedIndex = this.props.otherCheckedIndex;

    // console.log(otherColSelection);
    // console.log(otherColChecked);
    // console.log(otherCheckedIndex);

    // First do some basic error checking
    if (otherColChecked.length !== otherColSelection.length) {
      console.log("Some error exists");
    }

    // Now, we will create the selectedNeighbours array from otherColSelection and otherColChecked
    let selectedNeighbours = [];
    for (let i = 0; i < otherColChecked.length; ++i) {
      if (otherColChecked[i] === true) {
        selectedNeighbours.push(otherColSelection[i]);
      }
    }

    // If selectedNeighbours is not empty, we have to create the populateText and populateEle
    let populateEle = null;
    if (otherCheckedIndex !== -1 && selectedNeighbours.length > 0) {
      let populateText = "Populate this column with attributes ";
      for (let i = 0; i < selectedNeighbours.length; ++i) {
        let curText = i > 0 ? " OR " + selectedNeighbours[i].value : selectedNeighbours[i].value;
        populateText+=curText;
      }
      populateText+="?";
      populateEle = 
        <div>
          <p><b>{populateText}</b></p>
          <button onClick={(e) => this.props.populateOtherColumn(e, this.props.colIndex, selectedNeighbours)}>OK</button> 
        </div>
    }

    let returnEle = [];
    // We loop through the otherColSelection array, and push on the needed radio checkbox and textual information
    for (let i = 0; i < otherColSelection.length; ++i) {
      let additionEle = i === otherCheckedIndex ? populateEle : null;
      returnEle.push(
        <div>
          <div>
            <p>
              <input  
                type="checkbox"
                checked={otherColChecked[i]}
                onChange={(e) => this.props.toggleOtherNeighbour(e, i)}
              />
              {'\u00A0'}{'\u00A0'}
              {otherColSelection[i].label}
            </p>
          </div>
          {additionEle}
        </div>
      )
    }
    return returnEle;
  }

  render() {

    let selectionEle = this.createOtherColSelection();

    return (
      <div>
        <div>
          <p><b>Choose from attributes below</b> to determine the content for the this column</p>
        </div>
        <br />
        <div>
          {selectionEle}
        </div>
      </div>
    );
  }
}

export default OtherColSelection;

