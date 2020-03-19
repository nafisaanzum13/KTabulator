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
    let tableData = [];
    let tableHeader = [];
    let optionsMap = [];
    const initialRowNum = 10;
    const initialColNum = 3;
    for (let i=0;i<initialRowNum;++i) {
      let tempRow = [];
      for (let j=0;j<initialColNum;++j) {
        tempRow.push("");
      }
      tableData.push(tempRow);
    }
    for (let j=0;j<initialColNum;++j) {
      let emptyOptions = [];
      optionsMap.push(emptyOptions);
      tableHeader.push("");
    }
    this.state = {
      urlPasted:"",
      tablePasted:"",
      usecaseSelected:"",
      keyColIndex:0,        // initially the key column is the first column
      tableHeader:tableHeader,   // 1D array storing the table headers. Initially there are 3 empty columns.
      tableData:tableData,  // 2D array storing the table data (not including the table headers). Initally 10*3.
      optionsMap:optionsMap, // 2D array storing the options map
      keyColNeighbours:[], // 1D array storing the neighbours of the key column
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
    this.contextAddColumn = this.contextAddColumn.bind(this);
    this.contextSetKey = this.contextSetKey.bind(this);
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

    if (colIndex === this.state.keyColIndex) {

      // We first get all the non-empty values from the key column

      let allSubject = [];
      for (let i=0;i<this.state.tableData.length;++i) {
        if (this.state.tableData[i][colIndex] === "") {
          break;
        } else {
          allSubject.push(this.state.tableData[i][colIndex]);
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
        let optionsMap = this.state.optionsMap.slice();
        optionsMap[this.state.keyColIndex] = keyColOptions;
        this.setState({
          optionsMap:optionsMap,
        })
      });
    }
  }

  getOtherOptions(e,colIndex) {
    // This function ensures that if some cells in nonkey column has been entered, we want to update the header options 
    // when we are clicking on the header 

    if (colIndex !== this.state.keyColIndex) {
      // first we want to check if this column is all-empty
      let colEmpty = true;
      let nonEmptyInfo = [];
      for (let i=0;i<this.state.tableData.length;++i) {
        if (this.state.tableData[i][colIndex] !== "") {
          colEmpty = false;
          nonEmptyInfo.push([i,this.state.tableData[i][colIndex]]);
        }
      }
      // We only want to update the options if the column is non-empty
      if (colEmpty === false) {
        let prefixURL = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
        let suffixURL = "%0D%0A%7D%0D%0A%0D%0A&format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
        let queryBody = "SELECT+%3Fsomevar%0D%0AWHERE+%7B";
        for (let i=0;i<nonEmptyInfo.length;++i) {
          let curKeySubject = this.state.tableData[nonEmptyInfo[i][0]][this.state.keyColIndex];
          let curEnteredSubject = nonEmptyInfo[i][1];
          queryBody+="%0D%0A++++++++dbr%3A"+curKeySubject+"+%3Fsomevar+dbr%3A"+curEnteredSubject+".";
        }
        let queryURL=prefixURL+queryBody+suffixURL;
        fetch(queryURL)
        .then((response) => {
          return response.json();
        })
        .then((myJson) => {
          let otherColOptions = [];
          for (let i=0;i<myJson.results.bindings.length;++i) {
              let tempObj = {}
              let neighbour = myJson.results.bindings[i].somevar.value.slice(28);
              tempObj["label"] = neighbour;
              tempObj["value"] = neighbour;
              otherColOptions.push(tempObj);
          }
          let optionsMap = this.state.optionsMap.slice();
          optionsMap[colIndex] = otherColOptions;
          this.setState({
            optionsMap:optionsMap,
          }) 
        });
      }
    }
  }

  selectColHeader(e,colIndex) {
    let tableHeader = this.state.tableHeader.slice();
    tableHeader[colIndex] = e;
    // After we have selected the column header, not only do we want to fill in the name of the column, we also want to
    // ask in ActionPanel whether user wants to populate the column based on the chosen column name
    let tempObj = {};
    if (colIndex === this.state.keyColIndex) {
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
    // We also need to fetch the neighbours of this key column, and change all 

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
      let keyColNeighbours = [];
      for (let i=0;i<values[1].results.bindings.length;++i) {
        let tempObj = {};
        let neighbour = values[1].results.bindings[i].p.value.slice(28);
        tempObj["label"] = neighbour;
        tempObj["value"] = neighbour;
        keyColNeighbours.push(tempObj);
      }
      let optionsMap = this.state.optionsMap.slice();
      for (let i=0;i<optionsMap.length;++i) {
        if (i !== colIndex) {
          optionsMap[i] = keyColNeighbours;
        }
      }
      this.setState({
        keyColIndex:colIndex,
        keyColNeighbours:keyColNeighbours,
        curActionInfo:null,
        tableData:tableData,
        optionsMap:optionsMap,
      })
    })
  }

  populateOtherColumn(e, colIndex, neighbour) {

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

  // The follwing function adds a new column to the table, to the right of the context-menu clicked column.

  contextAddColumn(e,colIndex) {

    const rowNum = this.state.tableData.length;
    const colNum = this.state.tableData[0].length;

    // we first take care of table data's addition
    let tableData = [];
    for (let i=0;i<rowNum;++i) {
      let tempRow = [];
      for (let j=0;j<colIndex+1;++j) {
        tempRow.push(this.state.tableData[i][j]);
      }
      tempRow.push("");
      for (let k=colIndex+1;k<colNum;++k) {
        tempRow.push(this.state.tableData[i][k]);
      }
      tableData.push(tempRow);
    }

    // we now take care of optionsMap's addition, as well as tableHeader's addition
    // This added column will have options equal to the neighbours of the key column
    let optionsMap = [];
    let tableHeader = [];
    for (let j=0;j<colIndex+1;++j) {
      optionsMap.push(this.state.optionsMap[j]);
      tableHeader.push(this.state.tableHeader[j]);
    }
    optionsMap.push(this.state.keyColNeighbours);
    tableHeader.push("");
    for (let k=colIndex+1;k<colNum;++k) {
      optionsMap.push(this.state.optionsMap[k]);
      tableHeader.push(this.state.tableHeader[k]);
    }
    this.setState({
      tableData:tableData,
      tableHeader:tableHeader,
      optionsMap:optionsMap,
    })
  }

  // The following functions sets the cotextmenu selected column to be the key column
  contextSetKey(e,colIndex) {
    if (colIndex !== this.state.keyColIndex) {
      let prefixURL = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
      let suffixURL = "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
      let queryBody = "SELECT+%3Fp+%0D%0AWHERE+%7B%0D%0A++++++++dbr%3A"+this.state.tableData[0][colIndex]+"+%3Fp+%3Fo.%0D%0A++++++++BIND%28STR%28%3Fp%29+AS+%3FpString+%29.%0D%0A++++++++FILTER%28%0D%0A+++++++++++++++%21%28regex%28%3FpString%2C%22abstract%7CwikiPage%7Calign%7Ccaption%7Cimage%7Cwidth%7Cthumbnail%7Cblank%22%2C%22i%22%29%29+%0D%0A+++++++++++++++%26%26+regex%28%3FpString%2C+%22ontology%7Cproperty%22%2C+%22i%22%29%0D%0A+++++++++++++++%29%0D%0A%7D%0D%0A%0D%0A&";
      let queryURL = prefixURL+queryBody+suffixURL;
      fetch(queryURL)
      .then((response) => {
        return response.json();
      })
      .then((myJson) => {
        let keyColNeighbours = [];
        for (let i=0;i<myJson.results.bindings.length;++i) {
          let tempObj = {};
          let neighbour = myJson.results.bindings[i].p.value.slice(28);
          tempObj["label"] = neighbour;
          tempObj["value"] = neighbour;
          keyColNeighbours.push(tempObj);
        }
        let optionsMap = this.state.optionsMap.slice();
        for (let i=0;i<optionsMap.length;++i) {
          if (i !== colIndex) {
            optionsMap[i] = keyColNeighbours;
          }
        }
        this.setState({
          keyColIndex:colIndex,
          keyColNeighbours:keyColNeighbours,
          curActionInfo:null,
          optionsMap:optionsMap,
        })
      });
    }
  }

  render() {
    return (
      <div className="wrapper ">
        <div className="font-body">
          <div className="header">
            <Header />
          </div>
          <div className="row top-content">
            <div className="col-md-8 table-panel">
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
                optionsMap={this.state.optionsMap}
                contextAddColumn={this.contextAddColumn}
                contextSetKey={this.contextSetKey}/>
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
