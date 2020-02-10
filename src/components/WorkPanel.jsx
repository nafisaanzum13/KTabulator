import React, { Component } from "react";
import ReactTable from 'react-table-6';
import 'react-table-6/react-table.css';

class WorkPanel extends Component {
    constructor(props) {
      super(props);
      this.state = {
          curColumns: this.props.testColumns,
          curRows: this.props.testRows,
          showTable:false, // bool storing whether we want to display the table in WorkPanel or not
          searchKey:"City" // string storing for which entities we are making requests, it's "City" for now
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
        // // this is the place where we make the API call, fetch the data we need, (convert to JSON format),
        // // and change the table view

        // // There is an issue with updating the columns, leading to the .slice().
        // // Check out: https://spectrum.chat/react-table/general/add-columns-dynamically~5263b287-aa54-4403-9708-c017a3dfa349
        // // this.setState({
        // //     curColumns:curColumns.slice() 
        // // })

        // The first step, before we even make any requests, is to get the old columns of the table
        let updatedColumns = this.state.curColumns;
        let oldKeys=[],newKeys=[];
        for (let i=0;i<this.state.curColumns.length;++i) {
            oldKeys.push(this.state.curColumns[i].accessor);
        }      

        // Let's build the REAL city array from this.state.curRows
        let realCityArray=[];
        for (let i=0;i<this.state.curRows.length;++i) {
            realCityArray.push(this.state.curRows[i].City);
        }

        let dbResult = [];
        let newRow = [];
        let promiseArray = [];

        for (let i=0;i<realCityArray.length;++i) {
            let curURL = "http://vmdbpedia.informatik.uni-leipzig.de:8080/api/1.2.1/values?entities="+realCityArray[i]+
            "&property=dbo%3AareaTotal&format=JSON&pretty=NONE&limit=1000&offset=0&key=1234&oldVersion=false"
            let curPromise = cityGet(curURL);
            promiseArray.push(curPromise);
        }

        allPromiseReady(promiseArray).then((values) => {
            // We loop through the result array returned by all our network requests
            for (let i=0;i<values.length;++i) {
                let tempObj={};
                if (values[i].results.bindings[0].dboareaTotal === undefined) {
                    tempObj = {"City":realCityArray[i],"AreaTotal":"N/A"};
                } else {
                    dbResult = values[i].results.bindings[0].dboareaTotal.value;
                    tempObj = {"City":realCityArray[i],"AreaTotal":dbResult};
                }
                newRow.push(tempObj);
            }
            // Let's update the colJSON
            newKeys = Object.keys(newRow[0]);
            for (let i=0;i<newKeys.length;++i) {
                // If some property is not in the existing table(index is -1), we add it to updated columns
                if (oldKeys.indexOf(newKeys[i]) === -1) {
                    let tempHeader = {Header:newKeys[i],accessor:newKeys[i]};
                    updatedColumns.push(tempHeader);
                }
            }
            // console.log(updatedColumns);
            // colJSON has been updated

            // Now we update the rowJSON
            let updatedRows = joinObjects(this.state.curRows, newRow, this.state.searchKey);
            this.setState({
                curColumns:updatedColumns.slice(),
                curRows:updatedRows 
            })
            // This is successful!
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

// Below lists some test data and helper functions

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

function cityGet(url) {
    return fetch(url, {
        headers: {
        'Accept': 'application/json'
        }
    }).then((response) => response.json())
}

function allPromiseReady(promiseArray){
    return Promise.all(promiseArray);
}


