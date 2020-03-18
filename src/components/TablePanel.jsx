import React, { Component } from "react";
import Select from 'react-select';

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

    // i corresponds to the row number, j corresponds to the column number
    let tempRow = [];
    for (let j=0; j<colNum; ++j) {
      let options = [];
      if ((j === this.props.keyColIndex) || (this.props.keyColIndex === -1)) {
        options = this.props.keyColOptions;
      } else {
        options = this.props.otherColOptions;
      }
      tempRow.push(
        <th>
          <div onClick={(e) => this.props.getKeyOption(e,j)}>
            <Select
              value={this.props.tableHeader[j]}
              onChange={(e) => this.props.selectColHeader(e,j)}
              placeholder={"Choose header"}
              options={options}
              isMulti={false}
            />
          </div>
        </th>
      );
    }
    table.push(<tr>{tempRow}</tr>)

    for (let i = 0; i < rowNum; i++) {
        let tempRow = [];
        //Inner loop to create each cell of the row
        for (let j = 0; j < colNum; j++) {
          // Create the each cell
            tempRow.push(
              <td>
                <input type="text" 
                  value={this.props.tableData[i][j]} 
                  onChange={(e) => this.props.onCellChange(e,i,j)}/>
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
      </div>
    );
  }
}

export default TablePanel;
