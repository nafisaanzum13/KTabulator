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
          searchKey:"City", // string storing for which entities we are making requests, it's "City" for now
          searchColumn:"areaTotal" // string storing the column we want to add to the table, it's "areaTotal" for now
      };
      this.handleShowTable = this.handleShowTable.bind(this);
      this.handleAddColumn = this.handleAddColumn.bind(this);
      this.handleExploreNeighbour = this.handleExploreNeighbour.bind(this);
    }

    handleShowTable() {
        this.setState({
            showTable: true
        });
    }

    handleExploreNeighbour() {
        let url = "http://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=PREFIX+rdf%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0D%0APREFIX+rdfs%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0D%0APREFIX+owl%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%0D%0APREFIX+xsd%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%0D%0APREFIX+dbo%3A+%3Chttp%3A%2F%2Fdbpedia.org%2Fontology%2F%3E%0D%0APREFIX+dbr%3A+%3Chttp%3A%2F%2Fdbpedia.org%2Fresource%2F%3E%0D%0APREFIX+dbp%3A+%3Chttp%3A%2F%2Fdbpedia.org%2Fproperty%2F%3E%0D%0APREFIX+db%3A+%3Chttp%3A%2F%2Fdbpedia.org%2F%3E%0D%0A%0D%0A%0D%0ASELECT+%3Fp%0D%0AWHERE+%7B%0D%0A++dbr%3ABerlin+%3Fp+%3Fo.%0D%0A++BIND%28STR%28%3Fp%29+AS+%3FpString+%29.%0D%0A++FILTER%28isLiteral%28%3Fo%29+%26%26+%0D%0A+++%09%09%21%28regex%28%3FpString%2C%22abstract%7CwikiPage%22%2C%22i%22%29%29+%26%26%0D%0A++++%09regex%28%3FpString%2C%22ontology%22%2C%22i%22%29%29%0D%0A%7D&format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
        let neighboursFound = "";
        fetch(url)
        .then((response) => {
            return response.json();
        })
        .then((myJson) => {
            let bindingArray = myJson.results.bindings;
            for (let i=0;i<bindingArray.length;++i) {
                neighboursFound = neighboursFound+bindingArray[i].p.value+"\n";
            }
            alert("Here are the neighbours found:\n"+neighboursFound);
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

        // Let's build the REAL city array from this.state.curRows
        let realCityArray=[];
        for (let i=0;i<this.state.curRows.length;++i) {
            realCityArray.push(this.state.curRows[i].City);
        }

        // Let's use the Virtuoso interface to make our requests

        let dbResult = [];
        let newRow = [];
        let promiseArray = [];

        let prefixURL = "http://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=PREFIX+rdf%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0D%0APREFIX+rdfs%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0D%0APREFIX+owl%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%0D%0APREFIX+xsd%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%0D%0APREFIX+dbo%3A+%3Chttp%3A%2F%2Fdbpedia.org%2Fontology%2F%3E%0D%0APREFIX+dbr%3A+%3Chttp%3A%2F%2Fdbpedia.org%2Fresource%2F%3E%0D%0APREFIX+dbp%3A+%3Chttp%3A%2F%2Fdbpedia.org%2Fproperty%2F%3E%0D%0APREFIX+db%3A+%3Chttp%3A%2F%2Fdbpedia.org%2F%3E%0D%0A%0D%0A";
        let suffixURL = "%0D%0A%7D&format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
        for (let i=0;i<realCityArray.length;++i) {
            // We build the query body using the current city in realCityArray, and the current searchColumn
            let queryBody = "select+%3Fsomevar%0D%0Awhere+%7B%0D%0A%09dbr%3A"+realCityArray[i]+"+dbo%3A"+this.state.searchColumn+"+%3Fsomevar";
            let queryURL = prefixURL+queryBody+suffixURL;
            let curPromise = cityGet(queryURL);
            promiseArray.push(curPromise);
        }

        allPromiseReady(promiseArray).then((values) => {
            // We loop through the result array returned by all our network requests
            for (let i=0;i<values.length;++i) {;
                let tempObj={};
                // This mean result is not found
                if (values[i].results.bindings.length === 0) {
                    tempObj = {"City":realCityArray[i],"AreaTotal":"N/A"};
                }
                // If result is found, we create a new row object, and add it to newRow array 
                else {
                    dbResult = values[i].results.bindings[0].somevar.value;
                    tempObj = {"City":realCityArray[i],"AreaTotal":dbResult};
                }
                newRow.push(tempObj);
            }

            // Let's update the colJSON now. First we get old columns of the table
            let updatedColumns = this.state.curColumns;
            let oldKeys=[],newKeys=[];
            for (let i=0;i<this.state.curColumns.length;++i) {
                oldKeys.push(this.state.curColumns[i].accessor);
            } 

            // Then we get the new columns, and add it to the old columns if not exising already
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
        let curTable,curAdd,curExplore;
        if (this.state.showTable === false) {
            curTable=null;
            curAdd=null;
            curExplore=null;
        } else {
            curTable=
            <ReactTable 
                columns={this.state.curColumns} 
                data={this.state.curRows}>
            </ReactTable>
            curAdd=
            <button onClick={this.handleAddColumn}>Add Column: areaTotal (City)</button>
            curExplore=
            <button onClick={this.handleExploreNeighbour}>Explore Neighbour: Berlin</button>
        }
        return (
        <div className="row">
          <div className="col-md-6">
              <button onClick={this.handleShowTable}>Show Table Below</button>
              <div>
                  {curTable}
              </div>
          </div>
          <div className="col-md-3">
            <p>Explore Neighbours:</p>
            {curExplore}
          </div>
          <div className="col-md-3">
            <p>Action list:</p>
            {curAdd}
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
    return fetch(url).then((response) => response.json())
}

function allPromiseReady(promiseArray){
    return Promise.all(promiseArray);
}

// let curURL = "http://vmdbpedia.informatik.uni-leipzig.de:8080/api/1.2.1/values?entities="+realCityArray[i]+
// "&property=dbo%3AareaTotal&format=JSON&pretty=NONE&limit=1000&offset=0&key=1234&oldVersion=false"