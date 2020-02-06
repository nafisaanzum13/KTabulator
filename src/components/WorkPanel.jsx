import React, { Component } from "react";
import ReactTable from 'react-table-6';
import 'react-table-6/react-table.css';

class WorkPanel extends Component {
    constructor(props) {
      super(props);
      this.state = {
          curColumns: this.props.testColumns,
          curRows: this.props.testRows,
          showTable:false
      };
      this.handleShowTable = this.handleShowTable.bind(this);
      this.handleAddColumn = this.handleAddColumn.bind(this);
    }

    handleShowTable() {
        this.setState({
            showTable: true
        });
    }

    handleAddColumn() {
        // this is the place where we make the API call, fetch the data we need, (convert to JSON format),
        // and append it to the table view

        // First we add the new column(areaTotal in this case) into curColumns
        let updatedColumns = this.state.curColumns;
        let oldKeys=[],newKeys=[];
        for (let i=0;i<this.state.curColumns.length;++i) {
            oldKeys.push(this.state.curColumns[i].accessor);
        }
        newKeys = Object.keys(newRow[0]);
        for (let i=0;i<newKeys.length;++i) {
            if (oldKeys.indexOf(newKeys[i]) === -1) {
                let tempHeader = {Header:newKeys[i],accessor:newKeys[i]};
                updatedColumns.push(tempHeader);
            }
        }
        // There is an issue with updating the columns, leading to the .slice().
        // Check out: https://spectrum.chat/react-table/general/add-columns-dynamically~5263b287-aa54-4403-9708-c017a3dfa349
        // this.setState({
        //     curColumns:curColumns.slice() 
        // })

        // At this stage we have updated curColumns, which can be used in setState. Now we need to update the data
        let joinKey = "city"; // this is the joinKey we want to use to join the old data and the new data, it's "city" in this case
        let updatedRows = joinObjects(this.state.curRows, newRow, joinKey);
        this.setState({
            curColumns:updatedColumns.slice(),
            curRows:updatedRows 
        })
    }

    render() {
        let curTable,curActions;
        if (this.state.showTable === false) {
            curTable=null;
            curActions=null;
        } else {
            curTable=
            <ReactTable 
                columns={this.state.curColumns} 
                data={this.state.curRows}>
            </ReactTable>
            curActions=
            <button onClick={this.handleAddColumn}>Add Column: areaTotal (City)</button>
        }
        return (
        <div className="row">
          <div className="col-md-6">
              <button onClick={this.handleShowTable}>Show Table Below</button>
              <div>
                  {curTable}
              </div>
          </div>
          <div className="col-md-3 offset-md-3">
            <p>Action list:</p>
            {curActions}
          </div>
        </div>
        );
    }
}

export default WorkPanel;

const newRow = [
    {"city":"Berlin", "area":"100"},
    {"city":"Toronto","area":"120"},
    {"city":"Paris","area":"80"},
    {"city":"Shanghai","area":"150"},
    {"city":"Waterloo","area":"20"},
    {"city":"Melbourne","area":"200"},
    {"city":"New York","area":"150"},
    {"city":"Florence","area":"90"}
];

// 
function joinObjects() {
    var idMap = {};
    // Iterate over arguments
    let joinKey = arguments[arguments.length-1];
    for(var i = 0; i < arguments.length-1; i++) { 
        // Iterate over individual argument arrays (aka json1, json2)
        for(var j = 0; j < arguments[i].length; j++) {
            var currentID = arguments[i][j][joinKey];
            if(!idMap[currentID]) {
            idMap[currentID] = {};
            }
            // Iterate over properties of objects in arrays (aka id, name, etc.)
            for(let key in arguments[i][j]) {
                idMap[currentID][key] = arguments[i][j][key];
            }
        }
    }
    // push properties of idMap into an array
    var newArray = [];
    for(let property in idMap) {
        newArray.push(idMap[property]);
    }
    return newArray;
}

