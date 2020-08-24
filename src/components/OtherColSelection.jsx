import React, { Component } from "react";
import { Button } from "reactstrap";

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

    // We initialize the populateEle as text telling users they should select from the attribute list
    let populateEle = 
      <div className="fixed-populateEle">
        <b>Choose from attributes below</b> to determine the content for this column
        <br />
        <br />
      </div>

    // If selectedNeighbours is not empty, we have to create the populateText and populateEle
    if (otherCheckedIndex !== -1 && selectedNeighbours.length > 0) {
      let populateText = "Populate this column with attributes ";
      for (let i = 0; i < selectedNeighbours.length; ++i) {
        let curText = selectedNeighbours[i].type === "object" ? "is " + selectedNeighbours[i].value + " of" : selectedNeighbours[i].value;
        curText = i > 0 ? " OR " + curText : curText;
        populateText+=curText;
      }
      populateText+="?";
      populateEle = 
        <div className="fixed-populateEle">
          <b>{populateText}</b>
          {"\u00A0"}
          <Button onClick={(e) => this.props.populateOtherColumn(e, this.props.colIndex, selectedNeighbours)}>OK</Button> 
          <br />
          <br />
        </div>
    }

    let returnEle = [];
    // Modified on August 23rd: We want to display the textual information separately (not right next to any attribute)
    // We also want to make this div fixed
    returnEle.push(populateEle);

    // We loop through the otherColSelection array, and push on the needed radio checkbox
    for (let i = 0; i < otherColSelection.length; ++i) {
      returnEle.push(
        <div>
          <div>
            <p>
              <input  
                type="checkbox"
                checked={otherColChecked[i]}
                onChange={(e) => this.props.toggleOtherNeighbour(e, i, this.props.colIndex)}
              />
              {'\u00A0'}{'\u00A0'}
              {otherColSelection[i].label}
            </p>
          </div>
        </div>
      )
    }
    return returnEle;
  }

  render() {

    let selectionEle = this.createOtherColSelection();

    return (
      <div>
        {selectionEle}
      </div>
    );
  }
}

export default OtherColSelection;

