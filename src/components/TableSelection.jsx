// This component takes in 5 props:

// 1) originTableArray: 1D array storing all tables found on pasted URL
// 2) tableOpenList:    1D array storing whether each table in originTableArray has been toggled open or not
// 3) toggleTable:      function that handles the toggling on/off of a table
// 4) listType:         string. Has value "select" when we are using TableSelection to select the starting table.
//                              Has value "join" when we are using TableSelection in the join tables setting.
// 5) buttonFunction:   function corresponding to the listType.

import React, { Component } from "react";
import { Collapse } from "reactstrap";
import { FaTable } from "react-icons/fa";

class TableSelection extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.createButtonArray = this.createButtonArray.bind(this);
  }

  createButtonArray() {
    const originTableArray = this.props.originTableArray;
    let buttonArray = [];
    for (let i = 0; i < originTableArray.length; ++i) {
      // This first part create the buttons with text: table index plus column names
      // It also removes some newline characters
      let buttonText = "Table " + i + ": ";
      let headerCells = originTableArray[i].rows[0].cells;
      for (let j = 0; j < headerCells.length; ++j) {
        let headerData = removeNewLine(headerCells[j].innerText);
        if (headerData[headerData.length - 1] === "\n") {
          headerData = headerData.slice(0, -1);
        }
        buttonText = buttonText + headerData + "| ";
      }
      // Now let's update the table content
      let tableContent = (
        <div
          dangerouslySetInnerHTML={{
            __html: this.props.originTableArray[i].outerHTML,
          }}
        />
      );
      let selectButton;
      if (this.props.tableOpenList[i] === true) {
        let buttonText = "";
        if (this.props.listType === "select") {
          buttonText = "Select";
        }
        else {
          buttonText = "Join"
        }
        selectButton = 
          <button
            onClick={(e) => this.props.buttonFunction(e, i)}
          >
            {buttonText}
          </button>
      }
      buttonArray.push(
        <li
          className="list-group-item"
        >
        <span 
          onClick={(e) => this.props.toggleTable(e, i)}
        >
          {buttonText} {}
          <FaTable />
        </span>
        {selectButton}
          <Collapse isOpen={this.props.tableOpenList[i]}>
            <div>{tableContent}</div>
          </Collapse>
        </li>
      );
    }
    return (
      <ul className="list-group list-css list-group-flush">{buttonArray}</ul>
    );
  }

  render() {
    const numTables = this.props.originTableArray.length;
    let originTableArrayEle = null;
    if (numTables !== 0) {
      originTableArrayEle = <div>{this.createButtonArray()}</div>;
    }
    return <div>{originTableArrayEle}</div>;
  }
}

export default TableSelection;

function removeNewLine(str) {
  if (str[str.length - 1] === "\n") {
    return str.slice(0, -1);
  } else {
    return str;
  }
}
