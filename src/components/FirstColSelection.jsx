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

    // We initialize the populateEle as text telling users they should select from the attribute list
    let populateEle = (
      <div className="fixed-populateEle">
        <b>Choose from attributes below</b> to determine the content for the
        first column
        {/* <br /> */}
      </div>
    );
    
    // If selectedNeighbours is not empty, we have to create the populateText and populateEle
    if (keyCheckedIndex !== -1 && selectedNeighbours.length > 0) {
      let populateText =
        this.props.firstColFilled === false
          ? "Populate first column with entities that"
          : "Add to first column with entities that";
      for (let i = 0; i < selectedNeighbours.length; ++i) {
        let curText = i > 0 ? ", and" : "";
        if (selectedNeighbours[i].pDataset === "dct") {
          curText =
            curText + " are " + niceRender(selectedNeighbours[i].oValue);
        } else {
          curText =
            curText +
            " have " +
            selectedNeighbours[i].pValue +
            "=" +
            niceRender(selectedNeighbours[i].oValue);
        }
        populateText += curText;
      }
      populateText += "?";
      // We conditionally create the button element
      // If firstColFilled is false, we want to run populateKeyColumn
      // Otherwise, we want to run addKeyColumn
      let buttonEle =
        this.props.firstColFilled === false ? (
          <Button
            className="btn-sm"
            onClick={(e) =>
              this.props.populateKeyColumn(e, 0, selectedNeighbours)
            }
          >
            OK
          </Button>
        ) : (
          <Button
            className="btn-sm"
            onClick={(e) =>
              this.props.confirmAddFirstCol(e, selectedNeighbours)
            }
          >
            OK
          </Button>
        );
      populateEle = (
        <div className="fixed-populateEle">
          <b>{populateText}</b>
          {"\u00A0"}
          {buttonEle}
          <br />
        </div>
      );
    }

    // We now create the returnEle. First, we push on the populateEle
    let returnEle = [];
    // returnEle.push(populateEle);

    // Modified on August 26th: we want to add an input search bar that acts as a type-ahead
    let typeEle = (
      <div>
        <div>
          <p>
            Search for attributes:
            {"\u00A0"}
            <input
              value={this.props.firstColText}
              onChange={(e) => this.props.firstColTextChange(e)}
              placeholder={"Type here"}
            />
          </p>
        </div>
      </div>
    )
    returnEle.push(typeEle);

    // We loop over the firstColSelection array, and push on the needed radio checkbox and textual information
    for (let i = 0; i < firstColSelection.length; ++i) {
      if (firstColSelection[i].pValue === "category") {
        // Addition condition added here:
        // before pushing a neighbour on, we need to check either of the following two conditions meets
        // 1) this.props.firstColText is empty ("")
        // 2) niceRender(firstColSelection[i].oValue) includes this.props.firstColText
        if (this.props.firstColText === ""
            ||
            niceRender(firstColSelection[i].oValue).toUpperCase().includes(this.props.firstColText.toUpperCase())) {
          returnEle.push(
            <div>
              <div>
                <p>
                  <input
                    type="checkbox"
                    checked={firstColChecked[i]}
                    onChange={(e) => this.props.toggleFirstNeighbour(e, i)}
                  />
                  {"\u00A0"}
                  {"\u00A0"}
                  {niceRender(firstColSelection[i].oValue)}
                </p>
              </div>
            </div>
          );
        }
      } 
      else {
        // Addition condition added here:
        // before pushing a neighbour on, we need to check either of the following three conditions meets
        // 1) this.props.firstColText is empty ("")
        // 2) firstColSelection[i].pValue includes this.props.firstColText
        // 2) niceRender(firstColSelection[i].oValue) includes this.props.firstColText
        if (this.props.firstColText === ""
            ||
            firstColSelection[i].pValue.toUpperCase().includes(this.props.firstColText.toUpperCase())
            ||
            niceRender(firstColSelection[i].oValue).toUpperCase().includes(this.props.firstColText.toUpperCase())) {
          returnEle.push(
            <div>
              <p>
                <input
                  type="checkbox"
                  checked={firstColChecked[i]}
                  onChange={(e) => this.props.toggleFirstNeighbour(e, i)}
                />
                {"\u00A0"}
                {"\u00A0"}
                {firstColSelection[i].pValue}
                {":"}
                {"\u00A0"}
                {"\u00A0"}
                {"\u00A0"}
                {"\u00A0"}
                {"\u00A0"}
                {"\u00A0"}
                {"\u00A0"}
                {"\u00A0"}
                {niceRender(firstColSelection[i].oValue)}
              </p>
            </div>
          );
        }
      }
    }
    return (
      <div>
        {populateEle}
        <div className="padding-top-8vh">{returnEle}</div>
      </div>
    );
  }

  render() {
    let selectionEle = this.createFirstColSelection();

    return <div>{selectionEle}</div>;
  }
}

export default FirstColSelection;

// This function renders this.props.tableData[i][j].data in a nicer way.
// It removes all occurence of (...), and changes all "_" to " ".

function niceRender(str) {
  return str.replace(/_\(.*?\)/g, "").replace(/_/g, " ");
}
