import React, { Component } from "react";
// import TableSelection from "../components/TableSelection";
// import Tooltip from '@atlaskit/tooltip';
import Select from "react-select";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import { FaSearch } from "react-icons/fa";

class TablePanel extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.createSuperTable = this.createSuperTable.bind(this);
    this.createSelectedTableView = this.createSelectedTableView.bind(this);
  }

  // This function takes the states tableData, keyColIndex, keyEntryIndex, tableHeader, optionsMap
  // And convert them into HTML for the super table

  createSuperTable() {
    // console.log(this.props.tableData);
    const rowNum = this.props.tableData.length;
    const colNum = this.props.tableData[0].length;

    let table = [];

    // This part creates the table header row
    let tempRow = [];
    for (let colIndex = 0; colIndex < colNum; ++colIndex) {
      let tempHeader;
      // This part deals with the key column headers
      if (colIndex === this.props.keyColIndex) {
        let multiAllowed = colIndex === 0 ? true : false;
        tempHeader = (
          <th className="table-head">
            <div
              onClick={(e) => this.props.getKeyOptions(e, colIndex)}
              className="super-header-div"
            >
              <Select
                className="selection-header"
                value={this.props.tableHeader[colIndex]}
                onChange={(e) => this.props.selectColHeader(e, colIndex)}
                placeholder={"Choose header"}
                options={this.props.optionsMap[this.props.keyColIndex]}
                isMulti={multiAllowed}
              />
              <FaSearch
                className="search-icon"
                title={"Set as key column"}
                onClick={(e) => this.props.contextSetCell(e, 0, colIndex)}
              />
            </div>
          </th>
        );
      }
      // This part deals with the non-key column headers
      else {
        // console.log("Current column index is "+colIndex);
        // console.log(this.props.optionsMap);
        tempHeader = (
          <th className="table-head">
            <div
              onClick={(e) => this.props.getOtherOptions(e, colIndex)}
              className="super-header-div"
            >
              <Select
                className="selection-header"
                value={this.props.tableHeader[colIndex]}
                onChange={(e) => this.props.selectColHeader(e, colIndex)}
                placeholder={"Choose header"}
                options={this.props.optionsMap[colIndex]}
                isMulti={false}
              />
              <FaSearch
                className="search-icon"
                title={"Set as key column"}
                onClick={(e) => this.props.contextSetCell(e, 0, colIndex)}
              />
            </div>
          </th>
        );
      }
      tempRow.push(tempHeader);
    }
    table.push(
      <thead className="table-head">
        <tr>{tempRow}</tr>
      </thead>
    );

    // i corresponds to the row number, j corresponds to the column number

    // We are adding an ID for each cell for contextmenu
    let rows = [];
    for (let i = 0; i < rowNum; i++) {
      let tempRow = [];
      //Inner loop to create each cell of the row
      for (let j = 0; j < colNum; j++) {
        // Create the each cell
        let tempID = "cellRow" + i + "Col" + j;
        let cellColor;
        if (j === this.props.keyColIndex) {
          if (i === this.props.keyEntryIndex) {
            cellColor = { backgroundColor: "Yellow" };
          } else {
            cellColor = { backgroundColor: "LightBlue" };
          }
        } else {
          cellColor = { backgroundColor: "White" };
        }
        // console.log("Current data is "+this.props.tableData[i][j]);
        tempRow.push(
          <td style={cellColor}>
            <ContextMenuTrigger id={tempID}>
              <input
                className="twenty-vw"
                type="text"
                value={niceRender(this.props.tableData[i][j].data)}
                title={niceRender(this.props.tableData[i][j].data)}
                // onClick={() => {alert("hmm");}}
                onChange={(e) => this.props.onCellChange(e, i, j)}
                // onClick={() => alert("hmm")} something like this could work
              />
            </ContextMenuTrigger>
          </td>
        );
      }
      //Create the parent and add the children
      rows.push(<tr>{tempRow}</tr>);
    }
    table.push(<tbody>{rows}</tbody>);
    return table;
  }

  // This function makes no modification of the data at all.
  // It takes all the data from this.props.tableDataExplore, and convert them into HTML
  createSelectedTableView() {
    // console.log(rowNum);
    // console.log(colNum);
    // console.log(this.props.tableDataExplore[0][0].data);
    // console.log(this.props.tableDataExplore[0][0].origin);
    const rowNum = this.props.tableDataExplore.length;
    const colNum = this.props.tableDataExplore[0].length;

    let table = [];

    // This part creates the table header row
    let tempRow = [];
    for (let j = 0; j < colNum; ++j) {
      let tempHeader = (
        <th className="table-head table-col">
          {this.props.tableDataExplore[0][j].data}
        </th>
      );
      tempRow.push(tempHeader);
    }
    let tableHeaderRow = <tr className="table-head table-col">{tempRow}</tr>;
    table.push(<thead>{tableHeaderRow}</thead>);

    // i corresponds to the row number, j corresponds to the column number
    let tableRows = [];
    for (let i = 1; i < rowNum; i++) {
      let tempRow = [];
      //Inner loop to create each cell of the row
      for (let j = 0; j < colNum; j++) {
        // Create the each cell
        tempRow.push(
          <td className="table-col">
            {this.props.tableDataExplore[i][j].data}
          </td>
        );
      }
      //Create the parent and add the children
      tableRows.push(<tr>{tempRow}</tr>);
    }
    table.push(<tbody>{tableRows}</tbody>);
    return table;
  }

  render() {
    let tableEle = null;

    // In all cases, once we have pasted the URL. We want to display the super table in the table panel.
    let menuArray = [];
    for (let i = 0; i < this.props.tableData.length; ++i) {
      for (let j = 0; j < this.props.tableData[0].length; ++j) {
        let tempID = "cellRow" + i + "Col" + j;
        menuArray.push(
          <ContextMenu id={tempID}>
            <MenuItem onClick={(e) => this.props.contextAddColumn(e, j)}>
              Add Column to the Right
            </MenuItem>
            <MenuItem divider />
            <MenuItem onClick={(e) => this.props.contextDeleteColumn(e, j)}>
              Delete this column
            </MenuItem>
            <MenuItem divider />
            <MenuItem onClick={(e) => this.props.contextSetCell(e, i, j)}>
              Set as Search Cell
            </MenuItem>
            <MenuItem divider />
            <MenuItem onClick={(e) => this.props.contextCellOrigin(e, i, j)}>
              Show Origin of Cell
            </MenuItem>
            <MenuItem onClick={(e) => this.props.contextOpenLink(e, i, j)}>
              Open Wikipage for Cell
            </MenuItem>
          </ContextMenu>
        );
      }
    }
    tableEle = (
      // class table-fixed helps with sticky column headers
      <div>
        <table class border="1" className="table table-sm table-bordered">
          {this.createSuperTable()}
        </table>
        {menuArray}
      </div>
    );
    return <div>{tableEle}</div>;
  }
}

export default TablePanel;

// This function renders this.props.tableData[i][j].data in a nicer way. 
// It changes"_" to " ", and removes everything after the first occurence of (

function niceRender(str) {
  let resultStr = str;
  let bracketIndex = str.indexOf("(");
  // If ( is present in a string, we want to remove it
  // We include the -1 because usually ( is preceeded by _
  if (bracketIndex !== -1) {
    resultStr = resultStr.slice(0, bracketIndex-1);
  }
  // now we turn all "_" into " "
  return resultStr.replace(/_/g, " ");
}
