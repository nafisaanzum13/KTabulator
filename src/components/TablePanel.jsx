import React, { Component } from "react";
import Select from 'react-select';
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";

class TablePanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
    }
    this.createSuperTable = this.createSuperTable.bind(this);
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
          <div onClick={(e) => this.props.getKeyOptions(e,colIndex)}>
            <Select
              value={this.props.tableHeader[colIndex]}
              onChange={(e) => this.props.selectColHeader(e,colIndex)}
              placeholder={"Choose header"}
              options={this.props.optionsMap[this.props.keyColIndex]}
              isMulti={false}
            />
          </div>
        </th>
      } else {
        tempHeader =
        <th>
          <div onClick={(e) => this.props.getOtherOptions(e,colIndex)}>
            <Select
              value={this.props.tableHeader[colIndex]}
              onChange={(e) => this.props.selectColHeader(e,colIndex)}
              placeholder={"Choose header"}
              options={this.props.optionsMap[colIndex]}
              isMulti={false}
            />
          </div>
        </th>
      }
      tempRow.push(tempHeader);
    }
    table.push(<tr>{tempRow}</tr>)

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
                  type="text"
                  style={cellColor} 
                  value={this.props.tableData[i][j].data} 
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

  render() {
    let tableEle = null;

    // The following code sets up the context menus
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
            <MenuItem onClick={(e) => this.props.contextSetKey(e,j)}>
              Set as Key Column
            </MenuItem>
            <MenuItem divider />
            <MenuItem onClick={(e) => this.props.contextCellOrigin(e,i,j)}>
              Show Origin of Cell
            </MenuItem>
          </ContextMenu>
        );
      }
    }

    if (this.props.usecaseSelected === "") {
      tableEle = <h1>Welcome to WikiData Wrangler!</h1>
    } else if (this.props.usecaseSelected === "startSubject") {
      tableEle = 
        <table border="1"><tbody>{this.createSuperTable()}</tbody></table>
    } else {
      // do something
    }
    return (
      <div>
        {tableEle}
        {menuArray}
      </div>
    );
  }
}

export default TablePanel;
