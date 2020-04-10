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
      iframeURL:"",

      // states below are useful for startSubject
      keyColIndex:0,             // initially the key column is the first column
      tableHeader:tableHeader,   // 1D array storing the table headers. 
      tableData:tableData,       // 2D array of objects storing the table data (not including the table headers). 
      optionsMap:optionsMap,     // 2D array storing the options map
      keyColNeighbours:[],       // 1D array storing the neighbours of the key column
      curActionInfo:null,        // object storing the current action that should be displayed in ActionPanel. Initially null.

      // startes below are useful for exploreTable
      originTableArray:[],       // 1D array storing all tables found on pasted URL
      tableOpenList:[],          // 1D array storing whether each table in originTableArray has been toggled open or not
      selectedTableIndex:-1,     // index of table selected by user. If it's -1, take user to table selection. Else, show the table in Table Panel.
      tableDataExplore:[],       // 2D arary of objects storing the table data from explore table task. Similar to tableData above. Three properties: data, origin, rowSpan.
      // array of objects with four properties storing the status/content for each property neighbour
      // 1) predicate: string storing the predicate (ex. dbp:league)
      // 2) object: string storing the object (ex. dbo:NBA)
      // 3) isOpen: boolean storing whether the current property neighbour is toggled on or not
      // 4) siblingArary: array of objects with two properties storing the staus/content for each sibling URL
      //    4.1) isOpen:      boolean storing whether the current sibling is toggled on or not
      //    4.2) tableArray:  array of objects storing the status/content for each "same" table on the sibling URL
      //         4.2.1) isOepn:        boolean storing whether the current table is toggled on or not
      //         4.2.1) data:          HTML of a table    
      propertyNeighbours:[],     
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
    this.getOtherColPromise = this.getOtherColPromise.bind(this);
    this.populateOtherColumn = this.populateOtherColumn.bind(this);
    this.sameNeighbourDiffCol = this.sameNeighbourDiffCol.bind(this);
    this.sameNeighbourOneCol = this.sameNeighbourOneCol.bind(this);
    this.contextAddColumn = this.contextAddColumn.bind(this);
    this.contextSetKey = this.contextSetKey.bind(this);
    this.contextCellOrigin = this.contextCellOrigin.bind(this);

    // functions below are useful for exploreTable
    this.toggleTable = this.toggleTable.bind(this);
    this.onSelectTable = this.onSelectTable.bind(this);
    this.togglePropertyNeighbours = this.togglePropertyNeighbours.bind(this);
    this.toggleSibling = this.toggleSibling.bind(this);
    this.toggleOtherTable = this.toggleOtherTable.bind(this);
    this.unionTable = this.unionTable.bind(this);

    // functions below are generally usefull
    this.copyTable = this.copyTable.bind(this);
  };

  handleURLPaste(urlPasted) {
    this.setState({
      urlPasted: urlPasted,
      iframeURL: urlPasted,
    });
  }

  handleTablePaste(tablePasted) {
    this.setState({
      tablePasted: tablePasted
    });
  }

  // This function copies the table content to clipboard

  copyTable() {
    const textArea = document.createElement('textarea'); // this line allows the use of select() function
    let copiedText = "";
    // We handle the case for exploreTable and startSubject differently
    if (this.state.usecaseSelected === "exploreTable") {
      // This case handles the copy table for explore table. We fetch data directly from tableDataExplore
      const rowNum = this.state.tableDataExplore.length;
      const colNum = this.state.tableDataExplore[0].length;
      for (let i=0;i<rowNum;++i) {
        for (let j=0;j<colNum-1;++j) {
          copiedText = copiedText+this.state.tableDataExplore[i][j].data+"\t";
        }
        copiedText = copiedText+this.state.tableDataExplore[i][colNum-1].data+"\n";
      }
    } else if (this.state.usecaseSelected === "startSubject") {
      // We first push on the text for column headers (using the labels)
      let tableHeader = this.state.tableHeader;
      for (let i=0;i<tableHeader.length;++i) {
        let curText = tableHeader[i].label;
        if (curText !== undefined && curText !== "") {
          copiedText = copiedText+curText+"\t";
        }
      }
      copiedText+="\n";
      // Now we need to fetch the rows that are not column headers
      let tableData = this.state.tableData;
      const rowNum = tableData.length;
      const colNum = tableData[0].length;
      for (let i=0;i<rowNum;++i) {
        for (let j=0;j<colNum;++j) {
          let curText = tableData[i][j].data;
          if (curText !== undefined && curText !== "") {
            copiedText = copiedText+curText+"\t";
          }
        }
        copiedText+="\n";
      }
    } else {

    }
    textArea.value = copiedText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert("Table content has been pasted!");
  }

  handleSelectTask(e, taskSelected) {
    if (taskSelected === "startSubject") {
      // If user chooses "startSubject", we set the URL to be the first cell in the table
      const subject = reverseReplace(this.state.urlPasted.slice(30)); // add a reverseReplace here
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
        let originTableArray = doc.getElementsByClassName('wikitable');
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
      // It uses the common dct:subject of all cells entered in the key column

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
              tempObj["type"] = "subject";    // for now we only allow the subject search
              otherColOptions.push(tempObj);
          }
          let optionsMap = this.state.optionsMap.slice();
          optionsMap[colIndex] = otherColOptions;
          this.setState({
            optionsMap:optionsMap,
          }) 
        });
      }
      else {
        let optionsMap = this.state.optionsMap.slice();
        optionsMap[colIndex] = this.state.keyColNeighbours;
        this.setState({
          optionsMap:optionsMap,
        })
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
    tempObj["type"] = e.type;
    // We want to deal with duplicate neighbour names if we are selecting column headers for non-key columns
    if (colIndex !== this.state.keyColIndex) {
      let arr = elabel.split("-");
      if (arr.length > 1) {
        // arr[1] stores the index of the neighbour with duplicate names
        tempObj["neighbourIndex"] = Number(arr[1])-1;
      } else {
        // If neighbourIndex is equal to -1, that means this property has no duplicate names
        tempObj["neighbourIndex"] = -1;
      }
    }
    // console.log(tempObj);
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
    let keyColPromise = fetchJSON(queryURLOne);
    promiseArray.push(keyColPromise);

    // Below is the second query we will make.
    // This query fetches the neighbours for tableData[0][colIndex], so the first cell in column with index colIndex
    // These neighbours are either dbo or dbp, with some eliminations. In here we are using the tableCell as SUBJECT

    // SELECT ?p 
    // WHERE {
    //         dbr:Barack_Obama ?p ?o.
    //         BIND(STR(?p) AS ?pString ).
    //         FILTER(
    //               !(regex(?pString,"abstract|wikiPage|align|caption|image|width|thumbnail|blank","i")) 
    //               && regex(?pString, "ontology|property", "i")
    //               )
    // }

    let prefixURLTwo = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    let suffixURLTwo = "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    let queryBodyTwo = 
      "SELECT+%3Fp+%0D%0AWHERE+%7B%0D%0A++++++++dbr%3A"
      +regexReplace(this.state.tableData[0][colIndex].data)
      +"+%3Fp+%3Fo.%0D%0A++++++++BIND%28STR%28%3Fp%29+AS+%3FpString+%29.%0D%0A++++++++FILTER%28%0D%0A+++++++++++++++%21%28regex%28%3FpString%2C%22abstract%7CwikiPage%7Calign%7Ccaption%7Cimage%7Cwidth%7Cthumbnail%7Cblank%22%2C%22i%22%29%29+%0D%0A+++++++++++++++%26%26+regex%28%3FpString%2C+%22ontology%7Cproperty%22%2C+%22i%22%29%0D%0A+++++++++++++++%29%0D%0A%7D%0D%0A%0D%0A&";
    let queryURLTwo = prefixURLTwo+queryBodyTwo+suffixURLTwo;
    let otherColPromiseSubject = fetchJSON(queryURLTwo);
    promiseArray.push(otherColPromiseSubject);

    // Below is the third query we will make.
    // Difference with the previous query is that we are using tableData[0][colIndex] as OBJECT
    let prefixURLThree = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    let suffixURLThree = "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    let queryBodyThree = 
      "SELECT+%3Fp+%0D%0AWHERE+%7B%0D%0A++++++++%3Fs+%3Fp+dbr%3A"
      +regexReplace(this.state.tableData[0][colIndex].data)
      +".%0D%0A++++++++BIND%28STR%28%3Fp%29+AS+%3FpString+%29.%0D%0A++++++++FILTER%28%0D%0A+++++++++++++++%21%28regex%28%3FpString%2C%22abstract%7CwikiPage%7Calign%7Ccaption%7Cimage%7Cwidth%7Cthumbnail%7Cblank%22%2C%22i%22%29%29+%0D%0A+++++++++++++++%26%26+regex%28%3FpString%2C+%22ontology%7Cproperty%22%2C+%22i%22%29%0D%0A+++++++++++++++%29%0D%0A%7D%0D%0A&";
    let queryURLThree = prefixURLThree+queryBodyThree+suffixURLThree;
    let otherColPromiseObject = fetchJSON(queryURLThree);
    promiseArray.push(otherColPromiseObject);

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

      // let's now work with the second and third promise result: update the selection options for non-key columns

      let keyColNeighbours = [];
      keyColNeighbours = updateKeyColNeighbours(keyColNeighbours,values[1].results.bindings,"subject");
      keyColNeighbours = updateKeyColNeighbours(keyColNeighbours,values[2].results.bindings,"object");

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

  // The following function serves as a helper function for "populateOtherColumn" and "populateSameNeighbour"

  getOtherColPromise(neighbour, type) {
    let promiseArray = [];
    let prefixURL = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    let suffixURL = "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    for (let i=0; i<this.state.tableData.length;++i) {
      let cellValue = regexReplace(this.state.tableData[i][this.state.keyColIndex].data);
      if (cellValue === "N/A") {
        cellValue = "NONEXISTINGSTRING"; // N/A's will block the search, let's replace it with some string that does not block the search
      }
      let queryBody;
      if (type === "subject") {
        queryBody = "SELECT+%3Fsomevar%0D%0AWHERE+%7B%0D%0A++++++++dbr%3A"
                    +cellValue
                    +"+%28dbo%3A"+neighbour+"%7Cdbp%3A"+neighbour+"%29+%3Fsomevar.%0D%0A%7D%0D%0A%0D%0A&";
      } else {
        queryBody = "SELECT+%3Fsomevar+%0D%0AWHERE+%7B%0D%0A++++++++%3Fsomevar+%28dbo%3A"
                    +neighbour+"%7Cdbp%3A"+neighbour+"%29+dbr%3A"
                    +cellValue+"%0D%0A%7D%0D%0A&";
      }
      let queryURL = prefixURL+queryBody+suffixURL;
      let curPromise = fetchJSON(queryURL);
      promiseArray.push(curPromise);
    }
    return promiseArray;
  }

  populateOtherColumn(e, colIndex, neighbour, neighbourIndex, type) {

    // we need to make a number of queries in the form of: dbr:somekeycolumnentry dbp:neighbour|dbo:neighbour somevar
    let promiseArray = this.getOtherColPromise(neighbour,type);
    allPromiseReady(promiseArray).then((values) => {
      let tableData = this.state.tableData.slice();
      let requiredLength = neighbourIndex===-1?1 :neighbourIndex+1;
      for (let i=0;i<values.length;++i) {
        if (values[i].results.bindings.length < requiredLength) {
          // this means results is not found
          // or if there is not enough results, in duplicate neighbour name case
          tableData[i][colIndex].data = "N/A";
        } else {
          // let's determine if we need to truncate
          // Note: In here we are fetching the first value from the binding array. But sometimes there will be more than 1.
          // Think about what to do when there are duplicates
          let dbResult = values[i].results.bindings[requiredLength-1].somevar.value;
          let prefixToRemove = "http://dbpedia.org/resource/";
          // If dbResult contains prefix of "http://dbpedia.org/resource/", we want to remove it
          if (dbResult.includes(prefixToRemove) === true) {
              dbResult = dbResult.slice(28);
          }
          // We first set the data of the cell
          tableData[i][colIndex].data = dbResult;
          // We then set the origin of the cell
          // This origin depends on whether type is "subject" or "object"
          let originToAdd;
          // console.log(type);
          if (type === "subject") {
            originToAdd = neighbour+":"+dbResult;
          } else {
            originToAdd = "is "+neighbour+" of:"+dbResult;
          }
          // console.log(originToAdd);
          let keyOrigin = tableData[i][this.state.keyColIndex].origin.slice();
          // console.log(keyOrigin);
          keyOrigin.push(originToAdd);
          // console.log(keyOrigin);
          tableData[i][colIndex].origin = keyOrigin;
        }
      }

      // If we just populated a column with duplicate names, we want to give users an option to "populate all other columns of this name"

      let remainNeighbourCount = values[0].results.bindings.length-neighbourIndex-1;

      let tempObj = {};
      if ((neighbourIndex !== -1) && (remainNeighbourCount > 0)) {
        tempObj["task"] = "populateSameNeighbour";
        tempObj["colIndex"] = colIndex;
        tempObj["neighbour"] = neighbour;
        tempObj["neighbourIndex"] = neighbourIndex;
        tempObj["type"] = type;
        tempObj["numCols"] = remainNeighbourCount;
      } 

      this.setState({
        curActionInfo:tempObj,
        tableData:tableData,
      })
    })
  }

  // This function populates all neighbour with the same names, if that neighbour has multiple occurences.
  // Note: currently it only populates "later" neighbour with same name.

  sameNeighbourDiffCol(e,colIndex,neighbour,neighbourIndex,type,numCols) {

    // Now we need to write the body for this function

    // First thing should be to insert "numCols" number of empty columns right after column with index "colIndex"
    const rowNum = this.state.tableData.length;
    const colNum = this.state.tableData[0].length;

    // We first take care of table data's additions
    let tableData = [];
    for (let i=0;i<rowNum;++i) {
      let tempRow = [];
      for (let j=0;j<colIndex+1;++j) {
        tempRow.push(this.state.tableData[i][j]);
      }
      // we add in numCols number of empty columns
      for (let j=0;j<numCols;++j) {
        tempRow.push({"data":"","origin":[]});
      }
      for (let k=colIndex+1;k<colNum;++k) {
        tempRow.push(this.state.tableData[i][k]);
      }
      tableData.push(tempRow);
    }

    // we now take care of table header's addition. 
    let tableHeader = [];
    for (let j=0;j<colIndex+1;++j) {
      tableHeader.push(this.state.tableHeader[j]);
    }
    for (let j=0;j<numCols;++j) {
      let curLabel = "";
      if (type === "subject") {
        curLabel = curLabel+neighbour+"-"+(neighbourIndex+2+j)+"--"+tableHeader[this.state.keyColIndex].label;
      } else {
        curLabel = curLabel+"is "+neighbour+" of-"+(neighbourIndex+2+j)+"--"+tableHeader[this.state.keyColIndex].label;
      }
      tableHeader.push({"value":neighbour,"label":curLabel});
    }
    for (let k=colIndex+1;k<colNum;++k) {
      tableHeader.push(this.state.tableHeader[k]);
    }

    // we now take care of optionMap's addition. We just need to add some empty arrays to it
    let optionsMap = [];
    for (let j=0;j<colIndex+1;++j) {
      optionsMap.push(this.state.optionsMap[j]);
    }
    for (let j=0;j<numCols;++j) {
      optionsMap.push([]);
    }
    for (let k=colIndex+1;k<colNum;++k) {
      optionsMap.push(this.state.optionsMap[k]);
    }

    // Finally, we fill in the actual data for tableData. We need to take care of both data and origin
    let promiseArray = this.getOtherColPromise(neighbour,type);
    allPromiseReady(promiseArray).then((values) => {
      // for (let i=0;i<values.length;++i) {
      //   console.log(values[i].results.bindings);
      // }
      for (let curCol=colIndex+1;curCol<colIndex+1+numCols;++curCol) {
        // curNeighbourIndex represents the required length
        let requiredLength = neighbourIndex+curCol-colIndex+1; 
        for (let i=0;i<values.length;++i) {
          if (values[i].results.bindings.length < requiredLength) {
            // this means results is not found
            // or if there is not enough results, in duplicate neighbour name case
            tableData[i][curCol].data = "N/A";
          } else {
            // let's determine if we need to truncate
            // Note: In here we are fetching the first value from the binding array. But sometimes there will be more than 1.
            // Think about what to do when there are duplicates
            let dbResult = values[i].results.bindings[requiredLength-1].somevar.value;
            let prefixToRemove = "http://dbpedia.org/resource/";
            // If dbResult contains prefix of "http://dbpedia.org/resource/", we want to remove it
            if (dbResult.includes(prefixToRemove) === true) {
                dbResult = dbResult.slice(28);
            }
            // We first set the data of the cell
            tableData[i][curCol].data = dbResult;
            // We then set the origin of the cell
            // This origin depends on whether type is "subject" or "object"
            let originToAdd;
            // console.log(type);
            if (type === "subject") {
              originToAdd = neighbour+":"+dbResult;
            } else {
              originToAdd = "is "+neighbour+" of:"+dbResult;
            }
            // console.log(originToAdd);
            let keyOrigin = tableData[i][this.state.keyColIndex].origin.slice();
            // console.log(keyOrigin);
            keyOrigin.push(originToAdd);
            // console.log(keyOrigin);
            tableData[i][curCol].origin = keyOrigin;
          }
        }
      }
      this.setState({
        curActionInfo:null,
        tableData:tableData,
        tableHeader:tableHeader,
        optionsMap:optionsMap,
      })
    })
  }

  sameNeighbourOneCol(e,colIndex,neighbour,neighbourIndex,type,numCols) {
    // console.log(colIndex);
    // console.log(neighbour);
    // console.log(neighbourIndex);
    // console.log(type);
    // console.log(numCols);

    // In this option, we just need to change data in column "ColIndex", by putting "numCols" numbers of new values into it
    let tableData = this.state.tableData.slice();
    let promiseArray = this.getOtherColPromise(neighbour,type);
    allPromiseReady(promiseArray).then((values) => {

      for (let requiredLength = neighbourIndex+2;requiredLength<neighbourIndex+numCols+2;++requiredLength) {
        for (let i=0;i<values.length;++i) {
          if (values[i].results.bindings.length >= requiredLength) {
            let dbResult = values[i].results.bindings[requiredLength-1].somevar.value;
            let prefixToRemove = "http://dbpedia.org/resource/";
            // If dbResult contains prefix of "http://dbpedia.org/resource/", we want to remove it
            if (dbResult.includes(prefixToRemove) === true) {
                dbResult = dbResult.slice(28);
            }
            tableData[i][colIndex].data = tableData[i][colIndex].data+";"+dbResult;
            let updatedOrigin = tableData[i][colIndex].origin.slice();
            updatedOrigin[updatedOrigin.length-1] = updatedOrigin[updatedOrigin.length-1]+";"+dbResult;
            tableData[i][colIndex].origin = updatedOrigin;
          }
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
      // we add in one column of empty data
      tempRow.push({"data":"","origin":[]});
      for (let k=colIndex+1;k<colNum;++k) {
        tempRow.push(this.state.tableData[i][k]);
      }
      tableData.push(tempRow);
    }

    // we now take care of tabler header and optionMap's addition
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
      let promiseArray = [];
      let prefixURLOne = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
      let suffixURLOne = "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
      let queryBodyOne = 
        "SELECT+%3Fp+%0D%0AWHERE+%7B%0D%0A++++++++dbr%3A"
        +regexReplace(this.state.tableData[0][colIndex].data)
        +"+%3Fp+%3Fo.%0D%0A++++++++BIND%28STR%28%3Fp%29+AS+%3FpString+%29.%0D%0A++++++++FILTER%28%0D%0A+++++++++++++++%21%28regex%28%3FpString%2C%22abstract%7CwikiPage%7Calign%7Ccaption%7Cimage%7Cwidth%7Cthumbnail%7Cblank%22%2C%22i%22%29%29+%0D%0A+++++++++++++++%26%26+regex%28%3FpString%2C+%22ontology%7Cproperty%22%2C+%22i%22%29%0D%0A+++++++++++++++%29%0D%0A%7D%0D%0A%0D%0A&";
      let queryURLOne = prefixURLOne+queryBodyOne+suffixURLOne;
      let otherColPromiseSubject = fetchJSON(queryURLOne);
      promiseArray.push(otherColPromiseSubject);

      let prefixURLTwo = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
      let suffixURLTwo = "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
      let queryBodyTwo = 
        "SELECT+%3Fp+%0D%0AWHERE+%7B%0D%0A++++++++%3Fs+%3Fp+dbr%3A"
        +regexReplace(this.state.tableData[0][colIndex].data)
        +".%0D%0A++++++++BIND%28STR%28%3Fp%29+AS+%3FpString+%29.%0D%0A++++++++FILTER%28%0D%0A+++++++++++++++%21%28regex%28%3FpString%2C%22abstract%7CwikiPage%7Calign%7Ccaption%7Cimage%7Cwidth%7Cthumbnail%7Cblank%22%2C%22i%22%29%29+%0D%0A+++++++++++++++%26%26+regex%28%3FpString%2C+%22ontology%7Cproperty%22%2C+%22i%22%29%0D%0A+++++++++++++++%29%0D%0A%7D%0D%0A&";
      let queryURLTwo = prefixURLTwo+queryBodyTwo+suffixURLTwo;
      let otherColPromiseObject = fetchJSON(queryURLTwo);
      promiseArray.push(otherColPromiseObject);

      allPromiseReady(promiseArray).then((values) => {
        let keyColNeighbours = [];
        keyColNeighbours = updateKeyColNeighbours(keyColNeighbours,values[0].results.bindings,"subject");
        keyColNeighbours = updateKeyColNeighbours(keyColNeighbours,values[1].results.bindings,"object");
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

  // The following function handles the selection of table.

  onSelectTable(e,tableIndex) {
    // We need to let table panel display the selected table
    // And we need to update the Action Panel to display the first degree properties of the original page
    // We do a fetch request here (Sixth Query). It gets the property neighbours of the original page that are links, as well as dct:subject

    // First query gets the property neighbours 
    let queryPromise = [];
    let prefixURLOne = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    let suffixURLOne = "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    let queryBodyOne = 
      "SELECT+%3Fp+%3Fo%0D%0AWHERE+%7B%0D%0A++++++dbr%3A"
      +regexReplace(this.state.urlPasted.slice(30))
      +"+%3Fp+%3Fo.%0D%0A++++++BIND%28STR%28%3Fp%29+AS+%3FpString+%29.%0D%0A++++++FILTER%28isIRI%28%3Fo%29+%26%26+regex%28%3FpString%2C%22property%22%2C%22i%22%29+%26%26+%28%21regex%28%3FpString%2C%22text%22%2C%22i%22%29%29%29.%0D%0A%7D%0D%0A&";
    let queryURLOne = prefixURLOne+queryBodyOne+suffixURLOne;
    let queryOne = fetchJSON(queryURLOne);
    queryPromise.push(queryOne);

    // Second query gets the dct:subject neighbours 
    let prefixURLTwo = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    let suffixURLTwo = "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    let queryBodyTwo = 
      "SELECT+%3Fo%0D%0AWHERE+%7B%0D%0A++++++dbr%3A"
      +regexReplace(this.state.urlPasted.slice(30))
      +"+dct%3Asubject+%3Fo%0D%0A%7D&";
    let queryURLTwo = prefixURLTwo+queryBodyTwo+suffixURLTwo;
    // console.log(queryURLTwo);
    let queryTwo = fetchJSON(queryURLTwo);
    queryPromise.push(queryTwo);

    // now we process the query results
    allPromiseReady(queryPromise).then((queryResults) => {
      // console.log(queryResults[0].results.bindings);
      // console.log(queryResults[1].results.bindings);

      // First we fetch the property neighbours
      // Let's also do some prefetching at this stage: let's remove the propertyNeighbours with too many siblings (150)
      // and remove the propertyNeighbours with only one child (aka the originally pasted page)

      let propertyNeighboursPO = [];
      let promiseArray = [];
      let bindingArray = [];

      // The part below deals with the property neighbours
      bindingArray = queryResults[0].results.bindings;
      for (let i=0;i<bindingArray.length;++i) {
        let predicate = bindingArray[i].p.value.slice(28);
        let object = bindingArray[i].o.value.slice(28);
        let prefixURL = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
        let suffixURL = "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
        let queryBody = 
          "SELECT+%3Fs+%0D%0AWHERE+%7B%0D%0A%09%3Fs+dbp%3A"
          +regexReplace(predicate)
          +"+dbr%3A"
          +regexReplace(object)
          +"%0D%0A%7D%0D%0A&";
        let queryURL = prefixURL+queryBody+suffixURL;
        let curPromise = fetchJSON(queryURL);
        propertyNeighboursPO.push({"predicate":predicate,"object":object});
        promiseArray.push(curPromise);
      }

      // The part below deals with the dct:subject neighbours
      bindingArray = queryResults[1].results.bindings;
      for (let i=0;i<bindingArray.length;++i) {
        let object = bindingArray[i].o.value.slice(37);
        let prefixURL = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
        let suffixURL = "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
        let queryBody = 
          "SELECT+%3Fs%0D%0AWHERE+%7B%0D%0A++++++%3Fs+dct%3Asubject+dbc%3A"
          +regexReplace(object)
          +"%0D%0A%7D&";
        let queryURL = prefixURL+queryBody+suffixURL;
        let curPromise = fetchJSON(queryURL);
        propertyNeighboursPO.push({"predicate":"subject","object":object});
        promiseArray.push(curPromise);
      }

      // The part below processes all the siblings

      allPromiseReady(promiseArray).then((values) => {
        let propertyNeighbours = [];
        let urlOrigin = reverseReplace(this.state.urlPasted.slice(30));
        // console.log(urlOrigin);
        for (let i=0;i<values.length;++i) {
          let curSiblingArray = values[i].results.bindings;
          // Note, this 150 below should also be adjustable by users
          if (curSiblingArray.length > 1 && curSiblingArray.length<150) {
            let siblingArray = [];
            for (let i=0;i<curSiblingArray.length;++i) {
              let siblingName = curSiblingArray[i].s.value.slice(28);
              siblingArray.push({"isOpen":false,"name":siblingName,"content":"hello world","tableArray":[]});
            }
            // console.log(siblingArray);
            // console.log(siblingArray);
            propertyNeighbours.push(
              {"predicate":propertyNeighboursPO[i].predicate,
              "object":propertyNeighboursPO[i].object,
              "isOpen":false,
              "siblingArray":siblingArray});
          }
        }
        // we do a rudimentary ranking here: sort the property neighbours by the length of siblingArray
        propertyNeighbours.sort((a, b) => (a.siblingArray.length < b.siblingArray.length) ? 1 : -1);
        // Then we update the action in Action Panel
        let curActionInfo = {"task":"showPropertyNeighbours"};
        // Then we call the parse table helper function to update the tableDataExplore
        let selectedTableHTML = this.state.originTableArray[tableIndex];
        let tableDataExplore = setTableFromHTML(selectedTableHTML,urlOrigin);
        this.setState({
          selectedTableIndex:tableIndex,
          propertyNeighbours:propertyNeighbours,
          curActionInfo:curActionInfo,
          tableDataExplore:tableDataExplore,
        })
      })
    });
  }

  togglePropertyNeighbours(e,index) {
    // First let's do the toggling task
    let propertyNeighbours = this.state.propertyNeighbours.slice();
    propertyNeighbours[index].isOpen = !propertyNeighbours[index].isOpen;

    // we want to loop through all siblings if we are toggling a propertyNeighbour on
    if (propertyNeighbours[index].isOpen === true) {
      let bindingArray = propertyNeighbours[index].siblingArray;
      let siblingArray = [];
      let siblingNameArray = []; // this array keeps track of the sibiling names
      let promiseArray = [];
      for (let i=0;i<bindingArray.length;++i) {
        let siblingName = bindingArray[i].name;
        let siblingURL = "https://en.wikipedia.org/wiki/"+siblingName;
        let curPromise = fetchText(siblingURL);
        promiseArray.push(curPromise);
        siblingNameArray.push(siblingName);
        // NOTE! We are only keeping siblings with useful tables
      }
      allPromiseReady(promiseArray).then((values) => {
        for (let i=0;i<values.length;++i) {
          let tableHTML = this.state.originTableArray[this.state.selectedTableIndex];
          let pageHTML = values[i];
          let tableArray = findTableFromHTML(tableHTML,pageHTML); // This is a helper function that fetches useful tables from pageHTML
          // we potentially want to do something different here if urlOrigin === siblingNameArray[i]
          // We only want to keep siblings that do have useful tables
          if (tableArray.length !== 0) {
            siblingArray.push({"isOpen":false,"name":siblingNameArray[i],"content":"hello world","tableArray":tableArray});
          }
        }
        // This following line sorts the siblingArray
        siblingArray.sort((a, b) => (a.name > b.name) ? 1 : -1);
        propertyNeighbours[index].siblingArray = siblingArray;
        this.setState({
          propertyNeighbours:propertyNeighbours,
        })
      });
    } else {
      this.setState({
        propertyNeighbours:propertyNeighbours,
      })
    }
  }

  // The following function handles the toggling of a sibling URL

  toggleSibling(e,firstIndex,secondIndex) {

    // Handle the toggling task
    let propertyNeighbours = this.state.propertyNeighbours.slice();
    let selectedSibling = propertyNeighbours[firstIndex].siblingArray[secondIndex];
    selectedSibling.isOpen = !selectedSibling.isOpen;
    this.setState({
      propertyNeighbours:propertyNeighbours,
    })
  }

  // The following function handles the toggling of other table (that's the same as the selected table)

  toggleOtherTable(e,firstIndex,secondIndex,thirdIndex) {
    // First handle the toggling task
    let propertyNeighbours = this.state.propertyNeighbours.slice();
    const selectedTable = propertyNeighbours[firstIndex].siblingArray[secondIndex].tableArray[thirdIndex];
    selectedTable.isOpen = !selectedTable.isOpen;
    this.setState({
      propertyNeighbours:propertyNeighbours,
    })
  }

  // The following funcion unions the table that user has selected to the table in the TablePanel
  // by changing tableDataExplore

  unionTable(firstIndex,secondIndex,otherTableHTML) {
    let otherTableOrigin = this.state.propertyNeighbours[firstIndex].siblingArray[secondIndex].name;
    let otherTableData = setTableFromHTML(otherTableHTML,otherTableOrigin);
    otherTableData = otherTableData.slice(1); // we remove the column header row
    // We are literally one line away. Now just need to push this otherTableData with this.state.tableDataExplore
    let tableDataExplore = this.state.tableDataExplore.slice();
    tableDataExplore = tableDataExplore.concat(otherTableData);
    this.setState({
      tableDataExplore:tableDataExplore,
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
                tableDataExplore={this.state.tableDataExplore}
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
                sameNeighbourDiffCol={this.sameNeighbourDiffCol}
                sameNeighbourOneCol={this.sameNeighbourOneCol}
                // Folloiwng states are passed to "exploreTable"
                selectedTableIndex={this.state.selectedTableIndex}
                onSelectTable={this.onSelectTable}
                propertyNeighbours={this.state.propertyNeighbours}
                togglePropertyNeighbours={this.togglePropertyNeighbours}
                toggleSibling={this.toggleSibling}
                toggleOtherTable={this.toggleOtherTable}
                unionTable={this.unionTable}
                // Following states are passed for general purposes
                copyTable={this.copyTable}/>
            </div>
          </div>
          <div className="bottom-content">
            <div>
              <PagePanel 
                iframeURL={this.state.iframeURL}/>
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

// This function takes in a queryURL and returns its JSON format
function fetchJSON(url) {
  return fetch(url).then((response) => response.json())
}

// This function takes in a queryURL and returns its Text format
function fetchText(url) {
  return fetch(url).then((response) => response.text())
}

// This function ensures that all promises in promiseArray are ready
function allPromiseReady(promiseArray){
  return Promise.all(promiseArray);
}

// This function replaces string so that the result can be used in queryURL.
// It currently replaces "(", ")", "'", "-", " ", "&", ".", """,and "/"
function regexReplace(str) {
  return str.replace(/"/g,"%5Cu0022")
            .replace(/&/g,"%5Cu0026")
            .replace(/'/g,"%5Cu0027")
            .replace(/\(/g,"%5Cu0028")
            .replace(/\)/g,"%5Cu0029")
            .replace(/%E2%80%93/g,"%5Cu2013")
            .replace(/\./g,"%5Cu002E")
            .replace(/\//g,"%5Cu002F")
            .replace(/,/g,"%5Cu002C")
            .replace(/\s/g,"_");
}

function reverseReplace(str) {
  return str.replace(/%E2%80%93/,"–");
}

// This function updates the key column's neighbours.

// It taks three parameters: 
//  1) array "keyColNeighbour" storing list of neighbours for the key column
//  2) array "resultsBinding", storing the returned result of queryURL from Virtuoso
//  3) string "type", either "subject" or "object"

// It returns the updates keyColNeighbours
function updateKeyColNeighbours(keyColNeighbours, resultsBinding, type) {

  // we first sort the resultsBinding by p.value.slice(28)
  resultsBinding.sort((a, b) => (a.p.value.slice(28) > b.p.value.slice(28)) ? 1 : -1);

  // Then we give each option in the resultBinding the correct labels
  let neighbourCount = 1;
  for (let i=0;i<resultsBinding.length;++i) {
    let tempObj = {};
    let curNeighbourLiteral = resultsBinding[i].p.value.slice(28);
    // We do not want to deal with any neighbours that's only one character long: we don't know what it means
    if (curNeighbourLiteral.length > 1) {
      // Let's deal with duplicate neighbour names here
      let curNeighbourValue = curNeighbourLiteral;
      let curNeighbourLabel;
      if (type === "subject") {
        curNeighbourLabel = curNeighbourLiteral;
      } else {
        curNeighbourLabel = "is "+curNeighbourLiteral+" of";
      }
      let nextNeighbourValue = "";
      if (i<resultsBinding.length-1) {
        nextNeighbourValue = resultsBinding[i+1].p.value.slice(28);
      }
      if (curNeighbourValue === nextNeighbourValue) {
        if (type === "subject") {
          curNeighbourLabel = curNeighbourLiteral+"-"+neighbourCount;
        } else {
          curNeighbourLabel = "is "+curNeighbourLiteral+" of-"+neighbourCount;
        }
        neighbourCount++;
      } else {
        if (neighbourCount > 1) {
          if (type === "subject") {
            curNeighbourLabel = curNeighbourLiteral+"-"+neighbourCount;
          } else {
            curNeighbourLabel = "is "+curNeighbourLiteral+" of-"+neighbourCount;
          }
        }
        neighbourCount=1;
      }
      tempObj["label"] = curNeighbourLabel;
      tempObj["value"] = curNeighbourValue;
      tempObj["type"] = type;
      keyColNeighbours.push(tempObj);
    }
  }
  return keyColNeighbours;
}

function removeNewLine(str) {
  if (str[str.length-1] === "\n") {
    return str.slice(0,-1)
  } else {
    return str;
  }
}

function findTableFromHTML(tableHTML, pageHTML) {
  let doc = new DOMParser().parseFromString(pageHTML,"text/html");
  let wikiTablesFound = doc.getElementsByClassName('wikitable');
  let tablesFound = [];
  for (let i=0;i<wikiTablesFound.length;++i) {
    if (wikiTablesFound[i].tagName !== "TH") {
      tablesFound.push(wikiTablesFound[i]);
    }
  }

  // Let's first get the sorted names of the selected table (in table panel)
  let selectedHeaderCells = tableHTML.rows[0].cells;
  let originSortedCols = [];
  for (let j=0;j<selectedHeaderCells.length;++j) {
    let headerName = removeNewLine(selectedHeaderCells[j].innerText);
    originSortedCols.push(headerName);
  }
  // We sort the array for easier comparison.
  originSortedCols.sort();
  const originTableLength = originSortedCols.length;

  // Let's now look at the column names for each of the tables found on the sibling url
  // and push it the matched tables onto this siblings tableArray
  let tableArray = [];
  for (let i=0;i<tablesFound.length;++i) {
    let curHeaderCells = tablesFound[i].rows[0].cells;
    // we only want to check if two tables have the same columns if they have the same number of columns
    if (originTableLength === curHeaderCells.length) {
      let newSortedCols = [];
      for (let j=0;j<curHeaderCells.length;++j) {
        let headerName = removeNewLine(curHeaderCells[j].innerText);
        newSortedCols.push(headerName);
      }
      newSortedCols.sort();
      // we check, element by element, whether this table has the same column names as the selected table
      let matched = true;
      for (let i=0;i<originTableLength;++i)  {
        if (originSortedCols[i] !== newSortedCols[i]) {
          matched = false;
          break;
        }
      }
      if (matched === true) {
        // console.log("Found a match!");
        // console.log(tablesFound[i]);
        // console.log(selectedSibling.tableArray);
        // tableArray.push({"isOpen":false,"data":tablesFound[i]})
        // console.log(tablesFound[i]);
        // In here we need to do something like editing the tableArray for propertyNeighbours[firstIndex].siblingArray[secondIndex]
        tableArray.push({"isOpen":false,"data":tablesFound[i]})
      }
    }
  }
  return tableArray;
}

// This function returns a 2D array of objects representing the data for tableDataExplore. 

// It taks two parameters: 
//  1) HTML "selectedTableHTML" storing the HTML of a table
//  2) string "urlOrigin", storing which page this table is from

// It returns a 2D array of objects representing the data for tableDataExplore.
function setTableFromHTML(selecteTableHTML,urlOrigin) {
  let selectedTable = selecteTableHTML;
  let tempTable = [];

  // We first fetch the plain, unprocessed version of the table.
  for (let i=0;i<selectedTable.rows.length;++i) {
      let tempRow = [];
      for (let j=0;j<selectedTable.rows[i].cells.length;++j) {
          let curCellText = removeNewLine(selectedTable.rows[i].cells[j].innerText);
          let curRowSpan = selectedTable.rows[i].cells[j].rowSpan;
          tempRow.push({"data":curCellText,"origin":urlOrigin,"rowSpan":curRowSpan});
      }
      tempTable.push(tempRow);
  }
  
  // We now deal with rowspans.
  for (let i=0;i<tempTable.length;++i) {
    for (let j=0;j<tempTable[i].length;++j) {
        let curCellText = tempTable[i][j].data;
        if (tempTable[i][j].rowSpan > 1) {
            for (let k=1;k<tempTable[i][j].rowSpan;++k) {
                tempTable[i+k].splice(j,0,{"data":curCellText,"origin":urlOrigin,"rowSpan":1});
            }
        }
    }
  }

  // We now add in an additional column: the originURL of the page
  tempTable[0].splice(0,0,{"data":"OriginURL","origin":"null","rowSpan":1});
  for (let i=1;i<tempTable.length;++i) {
    tempTable[i].splice(0,0,{"data":urlOrigin,"origin":"null","rowSpan":1});
  }
  return tempTable; // tempTable is a 2D array of objects storing the table data. Object has two fields: data(string) and origin(string).
}




