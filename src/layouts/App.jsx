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
    const initialRowNum = 30;
    const initialColNum = 4;
    for (let i=0;i<initialRowNum;++i) {
      let tempRow = [];
      for (let j=0;j<initialColNum;++j) {
        // Initially, cell has no data or origin
        // data field is a string
        // origin field is an array of strings
        tempRow.push({"data":"","origin":[]});
      }
      tableData.push(tempRow);
    }
    for (let j=0;j<initialColNum;++j) {
      let emptyOptions = [];
      optionsMap.push(emptyOptions);
      tableHeader.push("");
    }
    this.state = {
      // states below are general states used throughout the app
      urlPasted:"",
      tablePasted:"",
      usecaseSelected:"",

      // states below are useful for startSubject
      keyColIndex:0,             // initially the key column is the first column
      tableHeader:tableHeader,   // 1D array storing the table headers. Initially there are 3 empty columns.
      tableData:tableData,       // 2D array storing the table data (not including the table headers). Initally 10*3.
      optionsMap:optionsMap,     // 2D array storing the options map
      keyColNeighbours:[],       // 1D array storing the neighbours of the key column
      curActionInfo:null,        // object storing the current action that should be displayed in ActionPanel. Initially null.

      // startes below are useful for exploreTable
      originTableArray:[],       // 1D array storing all tables found on pasted URL
      tableOpenList:[],          // 1D array storing whether each table in originTableArray has been toggled open or not
      selectedTableIndex:-1,     // index of table selected by user. If it's -1, take user to table selection. Else, show the table in Table Panel.
      propertyNeighbours:[],     // 1D array of objects storing the property neighbours of the pasted URL
      siblingArray:[],           // 1D array of objects storing the 1) hide/show status and 2)content for each property neighbour 
    };

    // functions below are useful during start up
    this.handleURLPaste = this.handleURLPaste.bind(this);
    this.handleTablePaste = this.handleTablePaste.bind(this);
    this.handleSelectTask = this.handleSelectTask.bind(this);

    // functions below are useful for startSubject
    this.cellChange = this.cellChange.bind(this);
    this.selectColHeader = this.selectColHeader.bind(this);
    this.getKeyOptions = this.getKeyOptions.bind(this);
    this.getOtherOptions = this.getOtherOptions.bind(this);
    this.populateKeyColumn = this.populateKeyColumn.bind(this);
    this.populateOtherColumn = this.populateOtherColumn.bind(this);
    this.contextAddColumn = this.contextAddColumn.bind(this);
    this.contextSetKey = this.contextSetKey.bind(this);
    this.contextCellOrigin = this.contextCellOrigin.bind(this);

    // functions below are useful for exploreTable
    this.toggleTable = this.toggleTable.bind(this);
    this.onSelectTable = this.onSelectTable.bind(this);
    this.togglePropertyNeighbours = this.togglePropertyNeighbours.bind(this);
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
      // If user chooses "startSubject", we set the URL to be the first cell in the table
      const subject = this.state.urlPasted.slice(30);
      let tableData = this.state.tableData.slice();
      tableData[0][0].data = subject;
      this.setState({
        usecaseSelected:taskSelected,
        tableData:tableData,
      });
    }
    else if (taskSelected === "exploreTable") {
      // If user chooses "exploreTable", we want to update the originTableArray, which stores all the tables found on the pasted URL
      // We also initialize tableOpenList to all false
      fetch(this.state.urlPasted)
      .then((response) => {
        return response.text();
      }) 
      .then((htmlText) => {
        // We first parse the pasted URL and store the list of tables from the pasted URL
        let doc = new DOMParser().parseFromString(htmlText,"text/html");
        let originTableArray = doc.getElementsByTagName('table');
        let tableOpenList = [];
        for (let i=0;i<originTableArray.length;++i) {
          tableOpenList.push(false);
        }
        this.setState({
          usecaseSelected:taskSelected,
          originTableArray:originTableArray,
          tableOpenList:tableOpenList,
        })
      });
    } 
    else {
      this.setState({
        usecaseSelected:taskSelected
      });
    }
  }

  // This function handles manually changing cell in a table

  cellChange(e,i,j) {

    e.preventDefault();
    let tableData = this.state.tableData.slice();
    tableData[i][j].data = e.target.value;
    this.setState({
      tableData:tableData
    })
  }

  // This function updates the options for selections when we click on selection for a key column
  // based on cells already filled in this column

  getKeyOptions(e,colIndex) {

    if (colIndex === this.state.keyColIndex) {

      // We first get all the non-empty values from the key column

      let allSubject = [];
      for (let i=0;i<this.state.tableData.length;++i) {
        if (this.state.tableData[i][colIndex].data === "") {
          break;
        } else {
          allSubject.push(regexReplace(this.state.tableData[i][colIndex].data));
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

  // This function updates the options for selections when we click on selection for non-key column
  // based on cells already filled in this column, and the cells in the key column

  getOtherOptions(e,colIndex) {

    if (colIndex !== this.state.keyColIndex) {
      // first we want to check if this column is all-empty
      let colEmpty = true;
      let nonEmptyInfo = [];
      for (let i=0;i<this.state.tableData.length;++i) {
        if (this.state.tableData[i][colIndex].data !== "") {
          colEmpty = false;
          nonEmptyInfo.push([i,this.state.tableData[i][colIndex].data]);
        }
      }
      // We only want to update the options if the column is non-empty
      if (colEmpty === false) {
        let prefixURL = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
        let suffixURL = "%0D%0A%7D%0D%0A%0D%0A&format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
        let queryBody = "SELECT+%3Fsomevar%0D%0AWHERE+%7B";
        for (let i=0;i<nonEmptyInfo.length;++i) {
          let curKeySubject = regexReplace(this.state.tableData[nonEmptyInfo[i][0]][this.state.keyColIndex].data);
          let curEnteredSubject = regexReplace(nonEmptyInfo[i][1]);
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

  // This function handles the the selection of a column header.

  selectColHeader(e,colIndex) {
    let tableHeader = this.state.tableHeader.slice();
    
    // This part creates differentiable column names
    // The first few lines fix some pass by reference problems 
    let evalue = e.value;
    let elabel = e.label;
    tableHeader[colIndex] = {"value":evalue,"label":elabel};
    if (colIndex !== this.state.keyColIndex) {
      tableHeader[colIndex].label = tableHeader[colIndex].label+"--"+tableHeader[this.state.keyColIndex].label;
    }

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

  // This function populates the key column
  // It also fetches the neighbours of the key column (based on the first cell in the table)
  // as well as setting the origins of cells in the key column

  populateKeyColumn(e, colIndex, neighbour) {

    // We will populate this column based on query: ?p dct:subject dbc:Presidents_of_United_States
    // We also need to fetch the neighbours of this key column, and change all 

    // For now we are populating ten entries only. So let's calculate how many entries we need to fill.
    let emptyEntryCount = this.state.tableData.length;
    for (let i=0;i<this.state.tableData.length;++i) {
      if (this.state.tableData[i][colIndex].data !== "") {
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
    let queryBodyOne = "SELECT+%3Fsomevar+%0D%0AWHERE+%7B%0D%0A%09%3Fsomevar+dct%3Asubject+dbc%3A"
                        +regexReplace(neighbour)
                        +".%0D%0A%7D%0D%0ALIMIT+"+emptyEntryCount;
    let queryURLOne = prefixURLOne+queryBodyOne+suffixURLOne;
    let keyColPromise = fetchOne(queryURLOne);
    promiseArray.push(keyColPromise);

    // Below is the second query we will make.
    // This query fetches the neighbours for tableData[0][colIndex], so the first cell in column with index colIndex
    let prefixURLTwo = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    let suffixURLTwo = "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    let queryBodyTwo = 
      "SELECT+%3Fp+%0D%0AWHERE+%7B%0D%0A++++++++dbr%3A"
      +regexReplace(this.state.tableData[0][colIndex].data)
      +"+%3Fp+%3Fo.%0D%0A++++++++BIND%28STR%28%3Fp%29+AS+%3FpString+%29.%0D%0A++++++++FILTER%28%0D%0A+++++++++++++++%21%28regex%28%3FpString%2C%22abstract%7CwikiPage%7Calign%7Ccaption%7Cimage%7Cwidth%7Cthumbnail%7Cblank%22%2C%22i%22%29%29+%0D%0A+++++++++++++++%26%26+regex%28%3FpString%2C+%22ontology%7Cproperty%22%2C+%22i%22%29%0D%0A+++++++++++++++%29%0D%0A%7D%0D%0A%0D%0A&";
    let queryURLTwo = prefixURLTwo+queryBodyTwo+suffixURLTwo;
    let otherColPromise = fetchOne(queryURLTwo);
    promiseArray.push(otherColPromise);

    allPromiseReady(promiseArray).then((values) => {

      // let's first work with the first promise result: fill in table data with the entities we have fetched

      // First part sets the data for each cell
      let tableData = this.state.tableData.slice();
      let rowNum = tableData.length;
      for (let i=0;i<values[0].results.bindings.length;++i) {
        tableData[i+rowNum-emptyEntryCount][colIndex].data = values[0].results.bindings[i].somevar.value.slice(28);
      }

      // second part sets the origin for each cell
      for (let i=0;i<rowNum;++i) {
        let tempOrigin = this.state.tableHeader[colIndex].value+":"+tableData[i][colIndex].data;
        tableData[i][colIndex].origin.push(tempOrigin);
      }

      // let's now work with the second promise result: update the selection options for non-key columns

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
      let cellValue = regexReplace(this.state.tableData[i][this.state.keyColIndex].data);
      if (cellValue === "N/A") {
        cellValue = "NONEXISTINGSTRING"; // N/A's will block the search, let's replace it with some string that does not block the search
      }
      let queryBody = "SELECT+%3Fsomevar%0D%0AWHERE+%7B%0D%0A++++++++dbr%3A"
                      +cellValue
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
          tableData[i][colIndex].data = "N/A";
        } else {
          // let's determine if we need to truncate
          let dbResult = values[i].results.bindings[0].somevar.value;
          let prefixToRemove = "http://dbpedia.org/resource/";
          // If dbResult contains prefix of "http://dbpedia.org/resource/", we want to remove it
          if (dbResult.includes(prefixToRemove) === true) {
              dbResult = dbResult.slice(28);
          }
          // We first set the data of the cell
          tableData[i][colIndex].data = dbResult;
          // We then set the origin of the cell
          let originToAdd = neighbour+":"+dbResult;
          let keyOrigin = tableData[i][this.state.keyColIndex].origin.slice();
          keyOrigin.push(originToAdd);
          tableData[i][colIndex].origin = keyOrigin;
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
      tempRow.push({"data":""});
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
      curActionInfo:null,
      optionsMap:optionsMap,
    })
  }

  // The following functions sets the cotextmenu selected column to be the key column
  contextSetKey(e,colIndex) {
    if (colIndex !== this.state.keyColIndex) {
      let prefixURL = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
      let suffixURL = "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
      let queryBody = 
        "SELECT+%3Fp+%0D%0AWHERE+%7B%0D%0A++++++++dbr%3A"
        +regexReplace(this.state.tableData[0][colIndex].data)
        +"+%3Fp+%3Fo.%0D%0A++++++++BIND%28STR%28%3Fp%29+AS+%3FpString+%29.%0D%0A++++++++FILTER%28%0D%0A+++++++++++++++%21%28regex%28%3FpString%2C%22abstract%7CwikiPage%7Calign%7Ccaption%7Cimage%7Cwidth%7Cthumbnail%7Cblank%22%2C%22i%22%29%29+%0D%0A+++++++++++++++%26%26+regex%28%3FpString%2C+%22ontology%7Cproperty%22%2C+%22i%22%29%0D%0A+++++++++++++++%29%0D%0A%7D%0D%0A%0D%0A&";
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

  contextCellOrigin(e,rowIndex,colIndex) {
    // To get the origin of a cell, we simply returns its "origin field"
    // The trick is to set the origin field correctly in previous functions
    // The place to do that should be in the two populating columns

    let cellSelected = this.state.tableData[rowIndex][colIndex];
    let originLiteral = "";
    for (let i=0;i<cellSelected.origin.length;++i) {
      if (i !== 0) {
        originLiteral+=" --> ";
      }
      originLiteral = originLiteral+cellSelected.origin[i];
    }
    
    // This origin literal correctly contains the cell Origin we want to display
    // Now we just need to show it in the ActionPanel
    let tempObj = {};
    tempObj["task"] = "contextCellOrigin";
    tempObj["origin"] = originLiteral;
    this.setState({
      curActionInfo:tempObj,
    })
  }

  toggleTable(e,index) {
    let tableOpenList = this.state.tableOpenList.slice();
    tableOpenList[index] = !tableOpenList[index];
    // When we toggle on one table, we want to close all other tables
    for (let i=0;i<tableOpenList.length;++i) {
      if (i !== index) {
        tableOpenList[i] = false;
      }
    }
    // We should change the Action Panel here, if we just toggled open a table
    if (tableOpenList[index] === true) {
      this.setState({
        tableOpenList:tableOpenList,
        curActionInfo:{"task":"selectTableIndex","tableIndex":index},
      })
    } else {
      this.setState({
        tableOpenList:tableOpenList,
        curActionInfo:null,
      })
    }
  }

  // The following function handles the selection of table

  onSelectTable(e,tableIndex) {
    // Firt thing we need to do is to let table panel display the selected table
    // Now we need to update the Action Panel to display the first degree properties of the original page
    // We do a fetch request here (Sixth Query)
    let prefixURL = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    let suffixURL = "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    let queryBody = 
      "SELECT+%3Fp+%3Fo%0D%0AWHERE+%7B%0D%0A++++++dbr%3A"
      +regexReplace(this.state.urlPasted.slice(30))
      +"+%3Fp+%3Fo.%0D%0A++++++BIND%28STR%28%3Fp%29+AS+%3FpString+%29.%0D%0A++++++FILTER%28isIRI%28%3Fo%29+%26%26+regex%28%3FpString%2C%22property%22%2C%22i%22%29+%26%26+%28%21regex%28%3FpString%2C%22text%22%2C%22i%22%29%29%29.%0D%0A%7D%0D%0A&";
    let queryURL = prefixURL+queryBody+suffixURL;

    fetch(queryURL)
    .then((response) => {
      return response.json();
    })
    .then((myJson) => {
      // First we fetch the property neighbours
      let propertyNeighbours = [];
      let bindingArray = myJson.results.bindings;
      for (let i=0;i<bindingArray.length;++i) {
        let predicate = bindingArray[i].p.value.slice(28);
        let object = bindingArray[i].o.value.slice(28);
        propertyNeighbours.push({"predicate":predicate,"object":object});
      }
      // Then we update the action in Action Panel
      let curActionInfo = {"task":"showPropertyNeighbours"};
      // Then we create the collapses corresponding to the property buttons in action panel
      let siblingArray = [];
      for (let i=0;i<propertyNeighbours.length;++i) {
        siblingArray.push({"isOpen":false,"linkArray":[]});
      }
      this.setState({
        selectedTableIndex:tableIndex,
        propertyNeighbours:propertyNeighbours,
        curActionInfo:curActionInfo,
        siblingArray:siblingArray,
      })
    });
  }

  // The following function handles the toggle of a property neighbour button

  togglePropertyNeighbours(e,index) {
    // First let's do the toggling task
    let siblingArray = this.state.siblingArray.slice();
    siblingArray[index].isOpen = !siblingArray[index].isOpen;

    // If the user decides to show some siblings, we need to update linkArray to meaningful contents
    if (siblingArray[index].isOpen === true) {

      // First let's run the fetch request
      let prefixURL = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
      let suffixURL = "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
      let queryBody = 
        "SELECT+%3Fs+%0D%0AWHERE+%7B%0D%0A%09%3Fs+dbp%3A"
        +regexReplace(this.state.propertyNeighbours[index].predicate)
        +"+dbr%3A"
        +regexReplace(this.state.propertyNeighbours[index].object)
        +"%0D%0A%7D%0D%0A&";
      let queryURL = prefixURL+queryBody+suffixURL;
      fetch(queryURL)
      .then((response) => {
        return response.json();
      })
      .then((myJson) => {
        // We want to get all the siblings 
        let bindingArray = myJson.results.bindings;
        let linkArray = [];
        for (let i=0;i<bindingArray.length;++i) {
          let siblingURL = bindingArray[i].s.value.slice(28);
          linkArray.push(
            <div className="row">
              <a 
                href="https://www.google.com" 
                onClick={(e) => {e.preventDefault();e.stopPropagation();return false;}}>
                {siblingURL}
              </a>
            </div>
          )
        }
        // Lastly, we want to update the siblingArray
        siblingArray[index].linkArray = linkArray;
        this.setState({
          siblingArray:siblingArray,
        })
      });
    } 
    else {
      this.setState({
        siblingArray:siblingArray,
      })
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
            <div className="col-md-7 table-panel">
              <TablePanel 
                urlPasted={this.state.urlPasted}
                usecaseSelected={this.state.usecaseSelected}
                // Following states are passed to "startSubject"
                tableHeader={this.state.tableHeader}
                tableData={this.state.tableData}
                keyColIndex={this.state.keyColIndex}
                onCellChange={this.cellChange}
                selectColHeader={this.selectColHeader}
                getKeyOptions={this.getKeyOptions}
                getOtherOptions={this.getOtherOptions}
                optionsMap={this.state.optionsMap}
                contextAddColumn={this.contextAddColumn}
                contextSetKey={this.contextSetKey}
                contextCellOrigin={this.contextCellOrigin}
                // Folloiwng states are passed to "exploreTable"
                originTableArray={this.state.originTableArray}
                tableOpenList={this.state.tableOpenList}
                toggleTable={this.toggleTable}
                selectedTableIndex={this.state.selectedTableIndex}/>
            </div>
            <div className="col-md-5 action-panel">
              <ActionPanel 
                urlPasted={this.state.urlPasted}
                usecaseSelected={this.state.usecaseSelected}
                curActionInfo={this.state.curActionInfo}
                handleURLPaste={this.handleURLPaste}
                handleSelectTask={this.handleSelectTask}
                populateKeyColumn={this.populateKeyColumn}
                populateOtherColumn={this.populateOtherColumn}
                // Folloiwng states are passed to "exploreTable"
                selectedTableIndex={this.state.selectedTableIndex}
                onSelectTable={this.onSelectTable}
                propertyNeighbours={this.state.propertyNeighbours}
                siblingArray={this.state.siblingArray}
                togglePropertyNeighbours={this.togglePropertyNeighbours}/>
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

function regexReplace(str) {
  // This function currently replaces "(", ")", "'",and "-"
  return str.replace(/\(/g,"%5Cu0028").replace(/\)/g,"%5Cu0029").replace(/%E2%80%93/g,"%5Cu2013").replace(/'/g,"%5Cu0027");
}
