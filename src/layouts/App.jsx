// We are starting again

// import { Route, Switch, Link } from "react-router-dom";
import React, { Component } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TablePanel from "../components/TablePanel";
import ActionPanel from "../components/ActionPanel";
import PagePanel from "../components/PagePanel";

class App extends Component {

  constructor(props) {
    super(props);
    let emptyTable = [];
    const initialRowNum = 10;
    const initialColNum = 3;
    for (let i=0;i<initialRowNum;++i) {
      let tempRow = [];
      for (let j=0;j<initialColNum;++j) {
        tempRow.push("");
      }
      emptyTable.push(tempRow);
    }
    this.state = {
      urlPasted:"",
      tablePasted:"",
      usecaseSelected:"",
      keyColIndex:-1,        // "startSubject": before we populate the first column, this will remain as -1
      tableHeader:["",""],   // 1D array storing the table headers. Initially there are two empty columns.
      tableData:emptyTable,  // 2D array storing the table data (not including the table headers). Initally 10*3.
      keyColOptions:[],    // 1D array storing the options passed to the key column's selection
      otherColOptions:[],    // 2D storing the mapping between otherCol's index and their selection options. Note: one of them will be empty, aka the keyColumn
      curActionInfo:null,    // object storing the current action that should be displayed in ActionPanel. Initially null.
    };
    this.handleURLPaste = this.handleURLPaste.bind(this);
    this.handleTablePaste = this.handleTablePaste.bind(this);
    this.handleSelectTask = this.handleSelectTask.bind(this);
    this.cellChange = this.cellChange.bind(this);
    this.selectColHeader = this.selectColHeader.bind(this);
    this.getKeyOptions = this.getKeyOptions.bind(this);
    this.getOtherOptions = this.getOtherOptions.bind(this);
    this.populateKeyColumn = this.populateKeyColumn.bind(this);
    this.populateOtherColumn = this.populateOtherColumn.bind(this);
  };

  handleURLPaste(urlPasted) {
    this.setState({
      urlPasted: urlPasted,
    });
  }

  handleTablePaste(tablePasted) {
    this.setState({
      tablePasted: tablePasted
    });
  }

  handleSelectTask(e, taskSelected) {
    if (taskSelected === "startSubject") {
      const subject = this.state.urlPasted.slice(30);
      let tableData = this.state.tableData.slice();
      tableData[0][0] = subject;
      this.setState({
        usecaseSelected:taskSelected,
        tableData:tableData,
      });
    } else {
      this.setState({
        usecaseSelected:taskSelected
      });
    }
  }

  cellChange(e,i,j) {

    // This function handles changing cell in a table

    e.preventDefault();
    let tableData = this.state.tableData.slice();
    tableData[i][j] = e.target.value;
    this.setState({
      tableData:tableData
    })
  }

  getKeyOptions(e,colIndex) {

    // This function changes keyColOptions if we are clicking on the selection header for a key column

    if ((this.state.keyColIndex === -1) || (colIndex === this.state.keyColIndex)) {

      // We first get all the non-empty values from the key column

      let allSubject = [];
      for (let i=0;i<this.state.tableData.length;++i) {
        if (this.state.tableData[i][0] === "") {
          break;
        } else {
          allSubject.push(this.state.tableData[i][0]);
        }
      }

      // In here we fetch the options for first column's selection

      let prefixURL = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
      let queryBody = "SELECT+%3Fsomevar%0D%0AWHERE+%7B";
      for (let i=0;i<allSubject.length;++i) {
        queryBody+="%0D%0A++++++++dbr%3A"+allSubject[i]+"+dct%3Asubject+%3Fsomevar.";
      }
      let suffixURL = "%0D%0A%7D%0D%0A&format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
      let queryURL = prefixURL+queryBody+suffixURL;
      fetch(queryURL)
      .then((response) => {
        return response.json();
      })
      .then((myJson) => {
        let keyColOptions = [];
        for (let i=0;i<myJson.results.bindings.length;++i) {
            let tempObj = {}
            let neighbour = myJson.results.bindings[i].somevar.value.slice(37);
            tempObj["label"] = neighbour;
            tempObj["value"] = neighbour;
            keyColOptions.push(tempObj);
        }
        this.setState({
          keyColOptions:keyColOptions,
        })
      });
    }
  }

  getOtherOptions(e,colIndex) {
    // This function ensures that if some cells in nonkey column has been entered, we want to update the header options 
    // when we are clicking on the header 

    // if ((this.state.keyColIndex !== -1) && (colIndex !== this.state.keyColIndex)) {
    //   // first we want to check if this column is all-empty
    //   let colEmpty = true;
    //   let nonEmptyInfo = [];
    //   for (let i=0;i<this.state.tableData.length;++i) {
    //     if (this.state.tableData[i][colIndex] !== "") {
    //       colEmpty = false;
    //       nonEmptyInfo.push([i,this.state.tableData[i][colIndex]]);
    //     }
    //   }
    //   // We only want to update the options if the column is non-empty
    //   if (colEmpty === false) {
    //     https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=
    //     SELECT+%3Fsomevar%0D%0AWHERE+%7B%0D%0A++++++++dbr%3ABarack_Obama+%3Fsomevar+dbr%3AMichelle_Obama.%0D%0A++++++++dbr%3ARonald_Reagan+%3Fsomevar+dbr%3ANancy_Reagan.%0D%0A%7D%0D%0A%0D%0A&
    //     format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+
    //     for (let i=0;i<nonEmptyInfo.length;++i) {
    //       console.log(this.state.tableData[nonEmptyInfo[i][0]][this.state.keyColIndex]);
    //     }
    //   }
    // }
  }

  selectColHeader(e,colIndex) {
    let tableHeader = this.state.tableHeader.slice();
    tableHeader[colIndex] = e;
    // After we have selected the column header, not only do we want to fill in the name of the column, we also want to
    // ask in ActionPanel whether user wants to populate the column based on the chosen column name
    let tempObj = {};
    if ((this.state.keyColIndex === -1) || (colIndex === this.state.keyColIndex)) {
      tempObj["task"] = "populateKeyColumn";
    } else {
      tempObj["task"] = "populateOtherColumn";
    }
    tempObj["colIndex"] = colIndex;
    tempObj["neighbour"] = e.value;
    this.setState({
      tableHeader:tableHeader,
      curActionInfo:tempObj,
    })
  }

  populateKeyColumn(e, colIndex, neighbour) {
    
    // This function populates the key column

    // We will populate this column based on query: ?p dct:subject dbc:Presidents_of_United_States

    // For now we are populating ten entries only. So let's calculate how many entries we need to fill.
    let emptyEntryCount = this.state.tableData.length;
    for (let i=0;i<this.state.tableData.length;++i) {
      if (this.state.tableData[i][colIndex] !== "") {
        emptyEntryCount--;
      } else {
        break;
      }
    }

    // Since we need to make two queries, we make a promise array
    let promiseArray = []; 

    // Below is the first query we will make. 
    // This query populates the first columns.
    let prefixURLOne = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    let suffixURLOne = "%0D%0A%0D%0A&format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    let queryBodyOne = "SELECT+%3Fsomevar+%0D%0AWHERE+%7B%0D%0A%09%3Fsomevar+dct%3Asubject+dbc%3A"+neighbour+".%0D%0A%7D%0D%0ALIMIT+"+emptyEntryCount;
    let queryURLOne = prefixURLOne+queryBodyOne+suffixURLOne;
    let keyColPromise = fetchOne(queryURLOne);
    promiseArray.push(keyColPromise);

    // Below is the second query we will make.
    // This query fetches the neighbours for tableData[0][colIndex], so the first cell in column with index colIndex
    let prefixURLTwo = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    let suffixURLTwo = "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    let queryBodyTwo = "SELECT+%3Fp+%0D%0AWHERE+%7B%0D%0A++++++++dbr%3A"+this.state.tableData[0][colIndex]+"+%3Fp+%3Fo.%0D%0A++++++++BIND%28STR%28%3Fp%29+AS+%3FpString+%29.%0D%0A++++++++FILTER%28%0D%0A+++++++++++++++%21%28regex%28%3FpString%2C%22abstract%7CwikiPage%7Calign%7Ccaption%7Cimage%7Cwidth%7Cthumbnail%7Cblank%22%2C%22i%22%29%29+%0D%0A+++++++++++++++%26%26+regex%28%3FpString%2C+%22ontology%7Cproperty%22%2C+%22i%22%29%0D%0A+++++++++++++++%29%0D%0A%7D%0D%0A%0D%0A&";
    let queryURLTwo = prefixURLTwo+queryBodyTwo+suffixURLTwo;
    let otherColPromise = fetchOne(queryURLTwo);
    promiseArray.push(otherColPromise);

    allPromiseReady(promiseArray).then((values) => {
      // let's first work with the first promise result
      let tableData = this.state.tableData.slice();
      for (let i=0;i<values[0].results.bindings.length;++i) {
        tableData[i+10-emptyEntryCount][colIndex] = values[0].results.bindings[i].somevar.value.slice(28);
      }
      // let's now work with the second promise result
      let otherColOptions = [];
      for (let i=0;i<values[1].results.bindings.length;++i) {
        let tempObj = {};
        let neighbour = values[1].results.bindings[i].p.value.slice(28);
        tempObj["label"] = neighbour;
        tempObj["value"] = neighbour;
        otherColOptions.push(tempObj);
      }
      this.setState({
        keyColIndex:colIndex,
        curActionInfo:null,
        tableData:tableData,
        otherColOptions:otherColOptions,
      })
    })
  }

  populateOtherColumn(e, colIndex, neighbour) {
    // console.log(this.state.keyColIndex);
    // console.log(colIndex);
    // console.log(neighbour);

    // Now we need to fill in the content for this function
    // we need to make ten queries in the form of: dbr:somekeycolumnentry dbp:neighbour|dbo:neighbour somevar
    let promiseArray = [];
    let prefixURL = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    let suffixURL = "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    for (let i=0; i<this.state.tableData.length;++i) {
      let queryBody = "SELECT+%3Fsomevar%0D%0AWHERE+%7B%0D%0A++++++++dbr%3A"
                      +this.state.tableData[i][this.state.keyColIndex]
                      +"+%28dbo%3A"+neighbour+"%7Cdbp%3A"+neighbour+"%29+%3Fsomevar.%0D%0A%7D%0D%0A%0D%0A&";
      let queryURL = prefixURL+queryBody+suffixURL;
      let curPromise = fetchOne(queryURL);
      promiseArray.push(curPromise);
    }
    allPromiseReady(promiseArray).then((values) => {
      let tableData = this.state.tableData.slice();
      for (let i=0;i<values.length;++i) {
        if (values[i].results.bindings.length === 0) {
          // this means results is not found
          tableData[i][colIndex] = "N/A";
        } else {
          // let's determine if we need to truncate
          let dbResult = values[i].results.bindings[0].somevar.value;
          let prefixToRemove = "http://dbpedia.org/resource/";
          // If dbResult contains prefix of "http://dbpedia.org/resource/", we want to remove it
          if (dbResult.includes(prefixToRemove) === true) {
              dbResult = dbResult.slice(28);
          }
          tableData[i][colIndex] = dbResult;
        }
      }
      this.setState({
        curActionInfo:null,
        tableData:tableData,
      })
    })
  }

  render() {
    return (
      <div className="wrapper ">
        <div className="font-body">
          <div className="header">
            <Header />
          </div>
          <div className="row top-content">
            <div className="col-md-8">
              <TablePanel 
                urlPasted={this.state.urlPasted}
                usecaseSelected={this.state.usecaseSelected}
                tableHeader={this.state.tableHeader}
                tableData={this.state.tableData}
                keyColIndex={this.state.keyColIndex}
                onCellChange={this.cellChange}
                selectColHeader={this.selectColHeader}
                getKeyOptions={this.getKeyOptions}
                getOtherOptions={this.getOtherOptions}
                keyColOptions={this.state.keyColOptions}
                otherColOptions={this.state.otherColOptions}/>
            </div>
            <div className="col-md-4">
              <ActionPanel 
                urlPasted={this.state.urlPasted}
                usecaseSelected={this.state.usecaseSelected}
                curActionInfo={this.state.curActionInfo}
                handleURLPaste={this.handleURLPaste}
                handleSelectTask={this.handleSelectTask}
                populateKeyColumn={this.populateKeyColumn}
                populateOtherColumn={this.populateOtherColumn}/>
            </div>
          </div>
          <div className="bottom-content">
            <div>
              <PagePanel 
                urlPasted={this.state.urlPasted}/>
            </div>
          </div>
          <div className="footer">
            <Footer />
          </div>
        </div>
      </div>
    );
  }
}

export default App;

function fetchOne(url) {
  return fetch(url).then((response) => response.json())
}

function allPromiseReady(promiseArray){
  return Promise.all(promiseArray);
}
