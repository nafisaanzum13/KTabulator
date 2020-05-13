import React, { Component } from "react";
import TableSelection from "../components/TableSelection";
// import Tooltip from '@atlaskit/tooltip';
import Select from 'react-select';
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import { FaSearch } from "react-icons/fa";

class TablePanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
    }
    this.createSuperTable = this.createSuperTable.bind(this);
    this.createSelectedTableView = this.createSelectedTableView.bind(this);
  }

  createSuperTable() {

    const rowNum = this.props.tableData.length;
    const colNum = this.props.tableData[0].length;

    let table = [];

    // This part creates the table header row
    let tempRow = [];
    for (let colIndex=0; colIndex<colNum; ++colIndex) {
      let tempHeader;
      if (colIndex === this.props.keyColIndex) {
        tempHeader =
        <th>
          <div onClick={(e) => this.props.getKeyOptions(e,colIndex)} className="super-header-div">
            <Select
              className="selection-header"
              value={this.props.tableHeader[colIndex]}
              onChange={(e) => this.props.selectColHeader(e,colIndex)}
              placeholder={"Choose header"}
              options={this.props.optionsMap[this.props.keyColIndex]}
              isMulti={false}
            />
            <FaSearch 
              className="search-icon"
              title={"Set as key column"}
              onClick={(e) => this.props.contextSetKey(e,colIndex)}/>
          </div>
        </th>
      } else {
        tempHeader =
        <th>
          <div onClick={(e) => this.props.getOtherOptions(e,colIndex)} className="super-header-div">
            <Select
              className="selection-header"
              value={this.props.tableHeader[colIndex]}
              onChange={(e) => this.props.selectColHeader(e,colIndex)}
              placeholder={"Choose header"}
              options={this.props.optionsMap[colIndex]}
              isMulti={false}
            />
            <FaSearch 
              className="search-icon"
              title={"Set as key column"}
              onClick={(e) => this.props.contextSetKey(e,colIndex)}/>
          </div>
        </th>
      }
      tempRow.push(tempHeader);
    }
    table.push(<thead><tr>{tempRow}</tr></thead>)

    // i corresponds to the row number, j corresponds to the column number

    // We are adding an ID for each cell for contextmenu

    for (let i = 0; i < rowNum; i++) {
        let tempRow = [];
        //Inner loop to create each cell of the row
        for (let j = 0; j < colNum; j++) {
          // Create the each cell
          let tempID = "cellRow"+i+"Col"+j;
          let cellColor;
          if (j === this.props.keyColIndex) {
            cellColor = {"backgroundColor":"LightBlue"};
          } else {
            cellColor = {"backgroundColor":"White"};
          }
          tempRow.push(
            <td>
              <ContextMenuTrigger id={tempID}>
                <input 
                  className="twenty-vw"
                  type="text"
                  style={cellColor} 
                  value={this.props.tableData[i][j].data} 
                  // onClick={() => {alert("hmm");}}
                  onChange={(e) => this.props.onCellChange(e,i,j)}/>
              </ContextMenuTrigger>
            </td>
          );
        }
        //Create the parent and add the children
        table.push(<tr>{tempRow}</tr>);
      }
      return table;
  }

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
    for (let j=0; j<colNum; ++j) {
      let tempHeader = <th>{this.props.tableDataExplore[0][j].data}</th>;
      tempRow.push(tempHeader);
    }
    table.push(<tr>{tempRow}</tr>)

    // i corresponds to the row number, j corresponds to the column number

    for (let i = 1; i < rowNum; i++) {
        let tempRow = [];
        //Inner loop to create each cell of the row
        for (let j = 0; j < colNum; j++) {
          // Create the each cell
          tempRow.push(
            <td>
              {this.props.tableDataExplore[i][j].data}
            </td>
          );
        }
        //Create the parent and add the children
        table.push(<tr>{tempRow}</tr>);
      }
      return table;
  }

  render() {
    let tableEle = null;

    // Case one: user hasn't selected any task yet
    if (this.props.usecaseSelected === "") {
      tableEle = <h3>Welcome to WikiData Wrangler!</h3>
    } 
    // Case two: user has chosen task "startSubject"
    else if (this.props.usecaseSelected === "startSubject") {
      let menuArray = [];
      for (let i=0;i<this.props.tableData.length;++i) {
        for (let j=0;j<this.props.tableData[0].length;++j) {
          let tempID = "cellRow"+i+"Col"+j;
          menuArray.push(
            <ContextMenu id={tempID}>
              <MenuItem onClick={(e) => this.props.contextAddColumn(e,j)}>
                Add Column to the Right
              </MenuItem>
              <MenuItem divider />
              {/* <MenuItem onClick={(e) => this.props.contextSetKey(e,j)}>
                Set as Key Column
              </MenuItem>
              <MenuItem divider /> */}
              <MenuItem onClick={(e) => this.props.contextCellOrigin(e,i,j)}>
                Show Origin of Cell
              </MenuItem>
            </ContextMenu>
          );
        }
      }
      tableEle = 
        // class table-fixed helps with sticky column headers
        <div>
          <table border="1" className="table-fixed">{this.createSuperTable()}</table>
          {menuArray}
        </div>
    } 
    // Case three: user has chosen task "exploreTable"
    else if (this.props.usecaseSelected === "exploreTable"){
      // Case 3.1: User has not selected a table yet
      if (this.props.selectedTableIndex === -1) {
        tableEle = 
          <TableSelection 
            originTableArray={this.props.originTableArray}
            tableOpenList={this.props.tableOpenList}
            toggleTable={this.props.toggleTable}
            selectedTableIndex={this.props.selectedTableIndex}/>
      } 
      // Case 3.2: User has selected a table
      // Make the second part into its own component
      else {
        // let originURL = reverseReplace(this.props.urlPasted.slice(30));
        // console.log(this.props.tableDataExplore);
        // Instead of logging tableDataExplore in the console, we want to use it to render a table
        tableEle = 
          <div className="row">
            <div className="col-md-12">
              {/* <div>Origin URL of table: {originURL}</div> */}
              <table border="1"><tbody>{this.createSelectedTableView()}</tbody></table>
            </div>
          </div>
      }
    } else {

    }
    return (
      <div>
        {tableEle}
      </div>
    );
  }
}

export default TablePanel;