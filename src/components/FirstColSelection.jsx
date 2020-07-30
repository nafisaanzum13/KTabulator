import React, { Component } from "react";

class FirstColSelection extends Component {
  state = {};

  render() {

    let selectionEle = createFirstColSelection(this.props.firstColSelection);

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

// This function creates the HTML element for first column's header selection
function createFirstColSelection(firstColSelection) {
  // console.log(firstColSelection);
  let returnEle = [];
  // We loop over the firstColSelection array, and push on the neede radio checkbox and textual information
  for (let i = 0; i < firstColSelection.length; ++i) {
    if (firstColSelection[i].pValue === "category") {
      returnEle.push(
        <div>
          <p>
            <input
              type="checkbox"
              checked={false}
            />
            {'\u00A0'}{'\u00A0'}
            {niceRender(firstColSelection[i].oValue)}
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
              checked={false}
            />
            {'\u00A0'}{'\u00A0'}
            {firstColSelection[i].pValue}
            {":"}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}
            {niceRender(firstColSelection[i].oValue)}
          </p>
        </div>
      )
    }
  }
  return returnEle;
}
