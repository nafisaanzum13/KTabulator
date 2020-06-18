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
        selectButton = 
          <button
            onClick={(e) => this.props.onSelectTable(e, i)}
          >
            Select
          </button>
      }
      buttonArray.push(
        <li
          className="list-group-item"
          // onClick={(e) => this.props.toggleTable(e, i)}
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
