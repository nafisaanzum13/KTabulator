// import { Route, Switch, Link } from "react-router-dom";
import React, { Component } from "react";
import { combinations } from "mathjs";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SettingModal from "../components/SettingModal";
import FilterModal from "../components/FilterModal";
import JoinModal from "../components/JoinModal";
import LandingPage from "../components/LandingPage";
import TablePanel from "../components/TablePanel";
import ActionPanel from "../components/ActionPanel";
import PagePanel from "../components/PagePanel";
import _ from "lodash";

const maxNeighbourCount = 50;
const initialColNum = 4;
const initialRowNum = 20;

class MainBody extends Component {
  constructor(props) {
    super(props);
    let tableData = [];
    let tableHeader = [];
    let optionsMap = [];
    for (let i = 0; i < initialRowNum; ++i) {
      let tempRow = [];
      for (let j = 0; j < initialColNum; ++j) {
        // Initially, cell has no data or origin
        // data field is a string
        // origin field is an array of strings
        tempRow.push({ data: "", origin: [] });
      }
      tableData.push(tempRow);
    }
    for (let j = 0; j < initialColNum; ++j) {
      let emptyOptions = [];
      optionsMap.push(emptyOptions);
      tableHeader.push([]);
    }
    this.state = {
      // states below are general states used throughout the app
      urlPasted: "",  
      tablePasted: "",
      usecaseSelected: "",
      pageHidden: false,
      iframeURL: "",
      curActionInfo: null, // object storing the current action that should be displayed in ActionPanel. Initially null.
      lastAction: "",      // string storing the last action that has modified the result table in the table panel
      prevState: "",       // objects storing the information needed to undo the last step. Information stored depends on lastAction
      showSetting: false,    // boolean storing whether setting modal is shown or not. Default to false.
      showTableSelection: false,    // boolean storing whether the list of tables from page is shown. Default to false.
      tabIndex: 1,         // integer storing the index of the tab currently displaying. Default to 1.
      showUnionTables: false,  // boolean storing whether all the unionable pages and tables is shown. Default to false.
      showJoinTables: false,   // boolean storing whether the page storing joinable tables is shown. Default to false.

      // states below are useful for startSubject
      keyColIndex: 0,   // number storing the index of the search column. initially the key column is the first column
      keyEntryIndex: 0, // number storing the index of the search entry in the search column. initially 0. (the first entry in the search column)
      // 1D array of objects with four properties storing the table headers. This array is used to create the column headers in table panel
      // 1) label:  string storing the label of an option (ex: spouse)
      // 2) value:  string storing the value of an option (ex: spouse)
      // 3) type:   string that's either "subject" or "object". Storing whether the current option is ?s or ?o with respect to key column. Can be empty.
      // 4) range:  string storing the rdfs:range of the current option.
      tableHeader: tableHeader,
      tableData: tableData, // 2D array of objects storing the table data (not including the table headers).
      optionsMap: optionsMap, // 2D array storing the options map
      keyColNeighbours: [], // 1D array storing the neighbours of the key column
      // An object with two attributes: subject and object
      // Subject and Object are both 1D arrays 
      // - Length tableData.length
      // - Each element is an object with multiple attributes. Ex: {birthdate:[1998-01-01], almaMater:[a, b, c]}
      firstDegNeighbours: [],

      // states below are useful for first column header selection
      firstColSelection: [],   // 1D array of objects storing information about the starting subject's neighbours
      firstColChecked: [],     // 1D array of booleans storing whether a neighbour of the starting subject is selected or not
      firstColFilled: false,   // boolean indicating whether the first column has been filled. 
                               // Will be set to true and remain that way after calling populateKeyColumn. 
      latestCheckedIndex: -1,  // index storing the most recent index that has just been toggled. Initially -1.

      // states below are useful for startTable
      originTableArray: [], // 1D array storing all tables found on pasted URL
      tableOpenList: [], // 1D array storing whether each table in originTableArray has been toggled open or not
      selectedTableIndex: -1, // index of table selected by user. If it's -1, take user to table selection. Else, show the table in Table Panel.
      selectedClassAnnotation: [], // semantic class annotation for each column of selected table
      // 2D arary of objects with three properties, which store the table data from explore table task. Similar to tableData above. 
      // Three properties: data, origin, rowSpan, colSpan.
      tableDataExplore: [], 
      // array of objects with four properties storing the status/content for each property neighbour
      // 1) predicate: string storing the predicate (ex. dbp:league)
      // 2) object: string storing the object (ex. dbo:NBA)
      // 3) isOpen: boolean storing whether the current property neighbour is toggled on or not
      // 4) siblingArary: array of objects with two properties storing the staus/content for each sibling URL
      //    4.1) isOpen:      boolean storing whether the current sibling is toggled on or not
      //    4.2) tableArray:  array of objects storing the status/content for each "same" table on the sibling URL
      //         4.2.1) isOepn:        boolean storing whether the current table is toggled on or not
      //         4.2.2) unionScore:    number storing teh union score of the current table (how "similar" it is to the original table)
      //         4.2.3) colMapping:    array of numbers storing the column mapping between the current table and the selected table
      //         4.2.4) data:          HTML of a table
      //         4.2.5) title:         array of strings storing the column headers of the current table
      propertyNeighbours: [],
      semanticEnabled: "disabled", // boolean value indicating whether semantic mapping is enabled or not. Default to true
      unionCutOff: 0.75, // number representing the union percentage a table must have to be considered unionable (>=)

      // states below are for column filter
      showFilter: false,        // boolean storing whether we want to show column filter or not. Initially false.
      curFilterIndex: -1,       // number storing the index of the column on which we apply the filter. Initially -1 (no filter.)
      dataAndChecked: [],       // array of [data, checked] pairs storing which data are in the filter column, and whether we should keep them.
    
      // states below are for table join
      showJoinModal: false,    // boolean storing whether the join option modal is show or not. Default to false.
      joinTableIndex: -1,      // number storing the index of the table we want to join from originTableArray.
      joinTableData: [],       // 2D array storing the data of the table we want to join from originTableArray. Initially empty.
      originColOptions: [],    // 1D array storing the selection options for the original table.
      joinColOptions: [],      // 1D array storing the selection options for the newly selected table.
      originJoinIndex: -1,     // number storing the index of the column of the original table that we are joining.
      joinJoinIndex: -1,       // number storing the index of the column of the newly selected table that we are joining.
    };

    // functions below are useful during start up
    this.handleURLPaste = this.handleURLPaste.bind(this);
    this.handleTablePaste = this.handleTablePaste.bind(this);
    this.handleStartSubject = this.handleStartSubject.bind(this);
    this.handleStartTable = this.handleStartTable.bind(this);

    // functions below are useful for startSubject
    this.cellChange = this.cellChange.bind(this);
    this.selectColHeader = this.selectColHeader.bind(this);
    this.getKeyOptions = this.getKeyOptions.bind(this);
    this.getOtherOptions = this.getOtherOptions.bind(this);
    this.getNeighbourPromise = this.getNeighbourPromise.bind(this);
    this.populateKeyColumn = this.populateKeyColumn.bind(this);
    this.getOtherColPromise = this.getOtherColPromise.bind(this);
    // this.getOtherColPromiseTwo = this.getOtherColPromiseTwo.bind(this);
    this.populateOtherColumn = this.populateOtherColumn.bind(this);
    this.addAllNeighbour = this.addAllNeighbour.bind(this);
    this.getTableStates = this.getTableStates.bind(this);
    this.sameNeighbourDiffCol = this.sameNeighbourDiffCol.bind(this);
    this.sameNeighbourOneCol = this.sameNeighbourOneCol.bind(this);
    // this.populateSameRange = this.populateSameRange.bind(this);
    this.populateRecommendation = this.populateRecommendation.bind(this);
    this.contextAddColumn = this.contextAddColumn.bind(this);
    this.contextDeleteColumn = this.contextDeleteColumn.bind(this);
    this.contextSetColumn = this.contextSetColumn.bind(this);
    this.contextCellOrigin = this.contextCellOrigin.bind(this);
    this.contextCellPreview = this.contextCellPreview.bind(this);
    this.contextOpenLink = this.contextOpenLink.bind(this);
    this.contextSortColumn = this.contextSortColumn.bind(this);

    // functions below are useful for startTable
    this.toggleTable = this.toggleTable.bind(this);
    this.togglePropertyNeighbours = this.togglePropertyNeighbours.bind(this);
    this.toggleSibling = this.toggleSibling.bind(this);
    this.toggleOtherTable = this.toggleOtherTable.bind(this);
    this.unionTable = this.unionTable.bind(this);
    this.unionPage = this.unionPage.bind(this);
    this.unionProperty = this.unionProperty.bind(this);
    this.toggleSemantic = this.toggleSemantic.bind(this);
    this.unionCutOffChange = this.unionCutOffChange.bind(this);

    // functions below are generally usefull
    this.copyTable = this.copyTable.bind(this);
    this.toggleWikiPage = this.toggleWikiPage.bind(this);
    this.undoPreviousStep = this.undoPreviousStep.bind(this);
    this.handleTabSwitch = this.handleTabSwitch.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.toggleTableSelection = this.toggleTableSelection.bind(this);
    this.toggleUnionJoin = this.toggleUnionJoin.bind(this);

    // functions below are for column filter
    this.openFilter = this.openFilter.bind(this);
    this.cancelFilter = this.cancelFilter.bind(this);
    this.toggleChecked = this.toggleChecked.bind(this);
    this.applyFilter = this.applyFilter.bind(this);

    // functions below are for join feature
    this.handleJoinTable = this.handleJoinTable.bind(this);
    this.cancelJoin = this.cancelJoin.bind(this);
    this.selectJoinColumn = this.selectJoinColumn.bind(this);
    this.runJoin = this.runJoin.bind(this);

    // functions below are for first column selection
    this.toggleNeighbourSelection = this.toggleNeighbourSelection.bind(this);
  }

  // As soon as the URL has been pasted, we want to fetch all tables from the pasted URL.
  // We then update the originTableArray, which stores all the tables found on the pasted URL
  // We also initialize tableOpenList to all false
  handleURLPaste(urlPasted) {
    document.body.classList.add('waiting');

    // Lastly, we updated the urlPasted and iframeURL

    if (!urlPasted.includes("https://en.wikipedia.org/wiki/")) {
      alert("Please paste a valid Wikipedia link.");
    }
    else {
      let promiseArray = [];
      promiseArray.push(fetchText(urlPasted));
      allPromiseReady(promiseArray).then((values) => {
        // We first parse the pasted URL and store the list of tables from the pasted URL
        let htmlText = values[0];
        let doc = new DOMParser().parseFromString(htmlText, "text/html");
        let originTableArray = doc.getElementsByClassName("wikitable");
        let tableOpenList = [];
        for (let i = 0; i < originTableArray.length; ++i) {
          tableOpenList.push(false);
        }

        // Adding support for undo:

        document.body.classList.remove('waiting');
        let lastAction = "handleURLPaste";
        let prevState = 
          {
            "urlPasted":"",
            "iframeURL":"",
            "originTableArray":[],
            "tableOpenList":[],
          };

        this.setState({
          originTableArray: originTableArray,
          tableOpenList: tableOpenList,
          urlPasted: urlPasted,
          iframeURL: urlPasted,
          lastAction: lastAction,
          prevState: prevState,
        });
      });
    }
  }

  handleTablePaste(tablePasted) {
    this.setState({
      tablePasted: tablePasted,
    });
  }

  // This function copies the table content to clipboard

  copyTable() {
    const textArea = document.createElement("textarea"); // this line allows the use of select() function
    let copiedText = "";
    // // We handle the case for startTable and startSubject differently

    // // This case handles the copy table for explore table. We fetch data directly from tableDataExplore
    // if (this.state.usecaseSelected === "startTable") {
    //   // This case handles the copy table for explore table. We fetch data directly from tableDataExplore
    //   const rowNum = this.state.tableDataExplore.length;
    //   const colNum = this.state.tableDataExplore[0].length;
    //   for (let i = 0; i < rowNum; ++i) {
    //     for (let j = 0; j < colNum - 1; ++j) {
    //       copiedText =
    //         copiedText + this.state.tableDataExplore[i][j].data + "\t";
    //     }
    //     copiedText =
    //       copiedText + this.state.tableDataExplore[i][colNum - 1].data + "\n";
    //   }
    // }

    // This case handles the copy table for start subject
    if (this.state.usecaseSelected === "startSubject" || this.state.usecaseSelected === "startTable") {
      // We first push on the text for column headers (using the labels)
      let tableHeader = this.state.tableHeader;
      for (let i = 0; i < tableHeader.length; ++i) {
        let curText = tableHeader[i].label;
        // console.log(curText);
        if (curText === undefined && tableHeader[i].length > 0) {
          curText = "";
          for (let j = 0; j < tableHeader[i].length; ++j) {
            if (j > 0) {
              curText += "&";
            }
            curText += tableHeader[i][j].label;
          }
        }
        if (curText !== undefined && curText !== "") {
          copiedText = copiedText + curText + "\t";
        }
      }
      copiedText += "\n";
      // Now we need to fetch the rows that are not column headers
      let tableData = this.state.tableData;
      const rowNum = tableData.length;
      const colNum = tableData[0].length;
      for (let i = 0; i < rowNum; ++i) {
        for (let j = 0; j < colNum; ++j) {
          let curText = niceRender(tableData[i][j].data);
          if (curText !== undefined && curText !== "") {
            copiedText = copiedText + curText + "\t";
          }
        }
        copiedText += "\n";
      }
    } else {
    }
    textArea.value = copiedText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    alert("Table content has been pasted!");
  }

  // This function handles the toggling of the WikiPage at bottom

  toggleWikiPage() {
    let pageHidden = this.state.pageHidden;
    this.setState({
      pageHidden: !pageHidden,
    });
  }

  // This function handles the selection of the starting task "startSubject"

  handleStartSubject(e, taskSelected) {

    if (taskSelected === "startSubject") {
      
      // Change the cursor since we are making a fetch request
      document.body.classList.add('waiting');

      // Since the starting task is "startSubject", we set the URL to be the first cell in the table
      const subject = decodeURIComponent(this.state.urlPasted.slice(30)); 
      let tableData = _.cloneDeep(this.state.tableData);
      tableData[0][0].data = subject;

      // Let's run some queries here to fetch some first degree properties 

      // The query we will run is simply as follows
      // select ?p ?o
      // where {
      // dbr:Barack_Obama ?p ?o.
      // }

      // Note: we are not taking account of the object neighbours. Subject neighbours only.

      let prefixURL = 
      "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
      let suffixURL = 
        "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
      let queryBody = 
        "select+%3Fp+%3Fo%0D%0Awhere+%7B%0D%0Adbr%3A" + 
        regexReplace(subject) +
        "+%3Fp+%3Fo.%0D%0A%7D&";
      let queryURL = prefixURL + queryBody + suffixURL;
      
      let promiseArray = [fetchJSON(queryURL)]
      
      allPromiseReady(promiseArray).then((values) => {

        // We set up the firstColSelection and firstColChecked states here
        let firstColSelection = updateFirstColSelection(values[0].results.bindings);
        let firstColChecked = [];
        // Initially, firstColChecked is all false
        for (let i = 0; i < firstColSelection.length; ++i) {
          firstColChecked.push(false);
        }
        // console.log(firstColSelection);
        // console.log(firstColChecked);

        // We create the InfoObject needed for Action Panel
        let tempObj = {
          "task":"afterStartSubject",
        };

        // Adding support for undo:
        let lastAction = "handleStartSubject";
        let prevState = 
          {
            "usecaseSelected":this.state.usecaseSelected,
            "tableData":this.state.tableData,
            "tabIndex":this.state.tabIndex,
            "curActionInfo":this.state.curActionInfo,
            "firstColSelection":this.state.firstColSelection,
            "firstColChecked":this.state.firstColChecked,
          };
        
        // Check the cursor back because we are done with the function
        document.body.classList.remove('waiting');

        this.setState({
          usecaseSelected: taskSelected,
          tableData: tableData,
          firstColSelection: firstColSelection,
          firstColChecked: firstColChecked,
          lastAction: lastAction,
          prevState: prevState,
          curActionInfo: tempObj,
          tabIndex: 0,
        });
      })
    } 
  }

  // This function handles the toggling of the starting subject's neighbours
  // If toggled ON, we want to add to tableHeader[0]'s array
  // Else, we remove it.
  // And based on this new tableHeader[0], we create the suggestions text.
  // Also, we store this toggledIndex, so that we can display the suggestion text at the right location.
  // Obviously, we need to update this.state.firstColChecked array.

  toggleNeighbourSelection(e, index) {
    // console.log("Toggled index is "+index);
    
    // We first create a copy of firstColChecked and tableHeader 
    let firstColChecked = this.state.firstColChecked.slice();
    // let tableHeader = this.state.tableHeader.slice();
    // console.log(tableHeader);

    // Start here, instead of manipulating things in tableHeader[0], let's craete

    // We create a copy of this.state.firstColSelection[index]
    // let toggledNeighbour = _.cloneDeep(this.state.firstColSelection[index]);
    // // If we are toggling the current neighbour ON, we want to push it to tableHeader[0]
    // if (firstColChecked[index] === false) {
    //   tableHeader[0].push(toggledNeighbour);
    // }
    // // Else, we want to remove it from tableHeader[0]. Note: it must currently be on tableHeader[0]
    // else {
    //   for (let i = 0; i < tableHeader[0].length; ++i) {
    //     let curNeighbour = tableHeader[0][i];
    //     // If we have found that curNeighbour is exactly the same as toggledNeighbour, we remove it from tableHeader[0]
    //     if (
    //         toggledNeighbour.pValue === curNeighbour.pValue &&
    //         toggledNeighbour.pDataset === curNeighbour.pDataset &&
    //         toggledNeighbour.oValue === curNeighbour.oValue &&
    //         toggledNeighbour.oType === curNeighbour.oType
    //       ) {
    //       tableHeader[0].splice(i, 1);
    //       break;
    //     }
    //   }
    // }

    // Now we deal with latestCheckedIndex
    let latestCheckedIndex = index;
    // // If, at this stage, tableHeader[0] is empty, we set lastestCheckedIndex back to -1
    // if (tableHeader[0].length === 0) {
    //   latestCheckedIndex = -1;
    // }
    // else {
    //   latestCheckedIndex = index;
    // }

    // Check if we have all the correct values.
    // console.log(tableHeader);
    // console.log(latestCheckedIndex);
  
    // We handle the toggling here
    firstColChecked[index] = !firstColChecked[index];

    // Lastly, we make the state changes
    this.setState({
      firstColChecked:firstColChecked,
      // tableHeader:tableHeader,
      latestCheckedIndex:latestCheckedIndex,
    })
  }

  // This function handles manually changing cell in a table

  cellChange(e, i, j) {
    e.preventDefault();
    let tableData = this.state.tableData.slice();
    tableData[i][j].data = e.target.value;
    this.setState({
      tableData: tableData,
    });
  }

  // This function updates the options for selections when we click on selection for a key column
  // based on cells already filled in this column

  getKeyOptions(e, colIndex) {
    if (colIndex === this.state.keyColIndex) {
      
      // We first get all the non-empty values from the key column
      let allSubject = [];
      for (let i = 0; i < this.state.tableData.length; ++i) {
        if (this.state.tableData[i][colIndex].data === "") {
          break;
        } else {
          allSubject.push(regexReplace(this.state.tableData[i][colIndex].data));
        }
      }

      // In here we fetch the options for first column's selection
      // It uses the common dct:subject of all cells entered in the key column

      // Modification: let's also find the common rdf:type dbo:xxx of cells filled.

      let prefixURL =
        "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
      let queryBody = "SELECT+%3Fsomevar%0D%0AWHERE+%7B";
      for (let i = 0; i < allSubject.length; ++i) {
        queryBody +=
          "%0D%0A++++++++dbr%3A" + allSubject[i] + "+%28dct%3Asubject%7Crdf%3Atype%29+%3Fsomevar.";
      }
      let suffixURL =
        "%0D%0A%7D%0D%0A&format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
      let queryURL = prefixURL + queryBody + suffixURL;
      let promiseArray = [];
      promiseArray.push(fetchJSON(queryURL));
      allPromiseReady(promiseArray).then((values) => {
        let myJson = values[0];
        let keyColOptions = [];
        // We loop through the result bindings. 
        // If it's from dct:subject, or rdf:type dbo:xxxx, we push it onto keyColOptions
        for (let i = 0; i < myJson.results.bindings.length; ++i) {
          let curValue = myJson.results.bindings[i].somevar.value;
          // This clause deals with dct:subject
          if (curValue.includes("dbpedia.org/resource/Category:")) {
            let tempObj = {};
            let neighbour = curValue.slice(37);
            tempObj["label"] = neighbour;
            tempObj["value"] = neighbour;
            tempObj["dataset"] = "dct";
            keyColOptions.push(tempObj);
          }
          // This clause deals with rdf:type dbo:xxxx
          else if (curValue.includes("dbpedia.org/ontology/") && !curValue.includes("Wikidata")) {
            let tempObj = {};
            let neighbour = curValue.slice(28);
            tempObj["label"] = neighbour;
            tempObj["value"] = neighbour;
            tempObj["dataset"] = "rdf";
            keyColOptions.push(tempObj);
          }
        }
        // Take a look at keyColOptions
        // console.log(keyColOptions);
        // We create a copy of the optionsMap.
        // Then change the entry in the optionsMap corresponding to the key column to what we have just fetched: keyColOptions.
        let optionsMap = this.state.optionsMap.slice();
        optionsMap[this.state.keyColIndex] = keyColOptions;
        this.setState({
          optionsMap: optionsMap,
        });
      });
    }
  }

  // This function updates the options for selections when we click on selection for non-key column
  // based on cells already filled in this column, and the cells in the key column
  // aka: Michelle Obama is Barack Obama' wife

  // If no cells is filled in this column, this function doesn't do anything.
  // If this column is completely filled, this function doesn't do anything either.

  getOtherOptions(e, colIndex) {

    if (colIndex !== this.state.keyColIndex) {
      // first we want to check if this column is all-empty, or all filled
      let colEmpty = true;
      let colFilled = true;
      let nonEmptyInfo = [];
      for (let i = 0; i < this.state.tableData.length; ++i) {
        // If some data is not "", that means this column is not empty
        if (this.state.tableData[i][colIndex].data !== "") {
          colEmpty = false;
          nonEmptyInfo.push([i, this.state.tableData[i][colIndex].data]);
        }
        // If some data is "", that means this column is not filled
        else {
          colFilled = false;
        }
      }
      // We only want to update the options if the column is non-empty, and not completely filled.
      // Make sure to modify this relation here to include only dbo and dbp
      if (colEmpty === false && colFilled === false) {
        let prefixURL =
          "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
        let suffixURL =
          "%0D%0A%7D%0D%0A%0D%0A&format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
        let queryBody = "SELECT+%3Fsomevar%0D%0AWHERE+%7B";
        for (let i = 0; i < nonEmptyInfo.length; ++i) {
          let curKeySubject = regexReplace(
            this.state.tableData[nonEmptyInfo[i][0]][this.state.keyColIndex]
              .data
          );
          let curEnteredSubject = regexReplace(nonEmptyInfo[i][1]);
          queryBody +=
            "%0D%0A++++++++dbr%3A" +
            curKeySubject +
            "+%3Fsomevar+dbr%3A" +
            curEnteredSubject +
            ".";
        }
        let queryURL = prefixURL + queryBody + suffixURL;
        let promiseArray = [];
        promiseArray.push(fetchJSON(queryURL));
        allPromiseReady(promiseArray).then((values) => {
          let myJson = values[0];
          let otherColOptions = [];
          for (let i = 0; i < myJson.results.bindings.length; ++i) {
            let tempObj = {};
            let neighbour = myJson.results.bindings[i].somevar.value.slice(
              28
            );
            tempObj["label"] = neighbour;
            tempObj["value"] = neighbour;
            tempObj["type"] = "subject"; // for now we only allow the subject search
            otherColOptions.push(tempObj);
          }
          let optionsMap = this.state.optionsMap.slice();
          optionsMap[colIndex] = otherColOptions;
          this.setState({
            optionsMap: optionsMap,
          });
        });
      } 
      // If this non-key column is empty or filled completely, we just use keyColNeighbours for the list of options
      else {
        let optionsMap = this.state.optionsMap.slice();
        optionsMap[colIndex] = this.state.keyColNeighbours;
        this.setState({
          optionsMap: optionsMap,
        });
      }
    }
  }

  // This function handles the the selection of a column header.
  // Note: we want to deal with the selection of key column header vs non key column header differently

  selectColHeader(e, colIndex) {

    let tableHeader = this.state.tableHeader.slice();

    if (e !== null) {

      // We first get the selectedOptions
      let selectedOptions = _.cloneDeep(e);
      // console.log(selectedOptions);
      tableHeader[colIndex] = selectedOptions;

      // This part deals with the selection of a key column header
      if (colIndex === this.state.keyColIndex) {
        let tempObj = {};
        tempObj["task"] = "populateKeyColumn";
        tempObj["colIndex"] = colIndex;
        tempObj["neighbourArray"] = [];
        // Since neighbourArray is an array, let's push on selectedOptions one by one
        for (let i = 0; i < selectedOptions.length; ++i) {
          tempObj.neighbourArray.push(selectedOptions[i]);
        }
        // console.log(tempObj);
        this.setState({
          tableHeader: tableHeader,
          curActionInfo: tempObj,
        })
      }

      // This part deals with the selection of a non key column header
      else {
        // We want to change the label of non-key column headers with respect to the label of key column
        // First step: set up the label text for the key column
        let keyColLabel = "";
        for (let i = 0; i < tableHeader[this.state.keyColIndex].length; ++i) {
          let labelToAdd = i > 0 ? "&" + tableHeader[this.state.keyColIndex][i].label : tableHeader[this.state.keyColIndex][i].label;
          keyColLabel+=labelToAdd;
        }
        // Then, since tableHeader[colIndex] is an array, we update all element's label from the array
        for (let i = 0; i < selectedOptions.length; ++i) {
          let ownLabel = tableHeader[colIndex][i].type === "subject" ? tableHeader[colIndex][i].value : "is " + tableHeader[colIndex][i].value + " of";
          tableHeader[colIndex][i].label = ownLabel + "--" + keyColLabel;
        }
        // console.log(tableHeader);

        // Now, we want to ask in ActionPanel whether user wants to populate the column based on the chosen column names
        let tempObj = {};
        tempObj["task"] = "populateOtherColumn";
        tempObj["colIndex"] = colIndex;
        tempObj["neighbourArray"] = [];
        // Since neighbourArray is an array, let's push on selectedOptions one by one
        for (let i = 0; i < selectedOptions.length; ++i) {
          tempObj.neighbourArray.push(selectedOptions[i]);
        }
        // Because we are allowing multi-selects now, type and range are no long two single strings.
        // Rather, their values can be figured out from neighbourArray
        // console.log(tempObj);
        this.setState({
          tableHeader: tableHeader,
          curActionInfo: tempObj,
        })
      }
    }



    // // console.log("Check table header here");
    // // console.log(this.state.tableHeader);
    // //  We first create a copy of the existing table headers
    // let tableHeader = this.state.tableHeader.slice();

    // // This part deals with the selection of key column header
    // if (colIndex === this.state.keyColIndex) {
    //   // We create a copy of the selected option
    //   if (e !== null) {
    //     let selectedOptions = e.slice();
    //     // console.log(selectedOptions);
    //     tableHeader[colIndex] = selectedOptions;
    //     let tempObj = {};
    //     tempObj["task"] = "populateKeyColumn";
    //     tempObj["colIndex"] = colIndex;
    //     tempObj["neighbourArray"] = [];
    //     // Modification here: instead of simplying passing the value, we want to pass the selectedOptions as a whole
    //     // Because we need its "dataset" attribute
    //     for (let i = 0; i < selectedOptions.length; ++i) {
    //       tempObj.neighbourArray.push(selectedOptions[i]);
    //     }
    //     // console.log(tempObj);
    //     this.setState({
    //       tableHeader: tableHeader,
    //       curActionInfo: tempObj,
    //     });
    //   }
    // }
    // // This part deals with the selection of non key column header
    // else {
    //   // The first few lines fix some pass by reference problems
    //   let evalue = e.value;
    //   let elabel = e.label;
    //   // let ecount = e.count;
    //   tableHeader[colIndex] = { value: evalue, label: elabel };
    //   // We want to change the label of non-key column headers with respect to the label of key column
    //   // We first create the label text for the key column
    //   let keyColLabel = "";
    //   if (this.state.keyColIndex === 0) {
    //     for (let i = 0; i < tableHeader[this.state.keyColIndex].length; ++i) {
    //       if (i > 0) {
    //         keyColLabel += "&";
    //       }
    //       keyColLabel += tableHeader[this.state.keyColIndex][i].label;
    //     }
    //   } else {
    //     keyColLabel = tableHeader[this.state.keyColIndex].label;
    //   }
    //   // Bugfix for Go Table Creation: if at this stage, keyColLable is still "", that means we came from the tabel union task first.
    //   // In this case, tableHeader[keyColIndex] is an object, not an array. 
    //   // So we just set keyColLabel as tableHeader[this.state.keyColIndex].label
    //   if (keyColLabel === "") {
    //     keyColLabel = tableHeader[this.state.keyColIndex].label;
    //   }
    //   // We then append the current column's label to it
    //   // console.log(keyColLabel);
    //   tableHeader[colIndex].label =
    //     tableHeader[colIndex].label + "--" + keyColLabel;
    //   // After we have selected the column header, not only do we want to fill in the name of the column, we also want to
    //   // ask in ActionPanel whether user wants to populate the column based on the chosen column name
    //   let tempObj = {};
    //   tempObj["task"] = "populateOtherColumn";
    //   tempObj["colIndex"] = colIndex;
    //   tempObj["neighbour"] = e.value;
    //   tempObj["type"] = e.type;

    //   // If type is subject, let's check if this neighbour also has a "range" (rdfs:range)
    //   if (e.type === "subject" && e.range !== undefined) {
    //     tempObj["range"] = e.range;
    //   }
    //   // console.log(tempObj);

    //   this.setState({
    //     tableHeader: tableHeader,
    //     curActionInfo: tempObj,
    //   });
    // }
  }

  // This function is a helper function for populateKeyColumn. It is similar to getOtherColPromise.
  // It makes an array of queries to find the union of neighbours for the first column (key column).

  // Some modification needs to be made to the queries
  // So that ?o in the first query and ?s in the second query have to be included as well.

  // It takes in three parameters
  // 1) tableData: tableData (with updated values in the first column)
  // 2) type: either "subject" or "object"
  // 3) colIndex:  integer representing which column's neighbours we are fetching

  getNeighbourPromise(tableData, type, colIndex) {
    // console.log(tableData);
    // console.log(type);

    // Query we make if type is subject

    // select ?p ?o ?range ?subPropertyOf
    // where {
    // dbr:Barack_Obama ?p ?o.
    // OPTIONAL {?p rdfs:range ?range}.
    // OPTIONAL {?p rdfs:subPropertyOf ?subPropertyOf}.
    // }

    // Query we make if type is object

    // select ?s ?p ?range ?subPropertyOf
    // where {
    // ?s ?p dbr:Barack_Obama.
    // OPTIONAL {?p rdfs:range ?range}.
    // OPTIONAL {?p rdfs:subPropertyOf ?subPropertyOf}.
    // }

    let promiseArray = [];
    let prefixURL =
      "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    let suffixURL =
      "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    for (let i = 0; i < tableData.length; ++i) {
      let cellValue = regexReplace(tableData[i][colIndex].data);
      // N/A's will block the search, let's replace it with some string that does not block the search
      if (cellValue === "N/A") {
        cellValue = "NONEXISTINGSTRING";
      }
      // console.log(cellValue);
      let queryBody;
      if (type === "subject") {
        queryBody =
          "select+%3Fp+%3Fo+%3Frange+%3FsubPropertyOf%0D%0Awhere+%7B%0D%0Adbr%3A" +
          cellValue +
          "+%3Fp+%3Fo.%0D%0AOPTIONAL+%7B%3Fp+rdfs%3Arange+%3Frange%7D.%0D%0AOPTIONAL+%7B%3Fp+rdfs%3AsubPropertyOf+%3FsubPropertyOf%7D.%0D%0A%7D&";
      }
      else {
        queryBody = 
          "select+%3Fs+%3Fp+%3Frange+%3FsubPropertyOf%0D%0Awhere+%7B%0D%0A%3Fs+%3Fp+dbr%3A" +
          cellValue +
          ".%0D%0AOPTIONAL+%7B%3Fp+rdfs%3Arange+%3Frange%7D.%0D%0AOPTIONAL+%7B%3Fp+rdfs%3AsubPropertyOf+%3FsubPropertyOf%7D.%0D%0A%7D&";
      }
      let queryURL = prefixURL + queryBody + suffixURL;
      let curPromise = fetchJSON(queryURL);
      promiseArray.push(curPromise);
    }
    return promiseArray;
  }

  // This function populates the key column
  // It also fetches the neighbours of the key column (based on the first cell in the table)
  // as well as setting the origins of cells in the key column

  // Note: we need to do some modification here. Instead of having a fixed number of entries in the key column,
  // Let's make it more flexible. (but also pose a limit, so we don't get way too many entries)

  populateKeyColumn(e, colIndex, neighbourArray) {
    // Let's first take a look at parameters passed in
    console.log(colIndex);
    console.log(neighbourArray);

    // Let's create a helper function to generate the query text.
    let queryURL = keyQueryGen(neighbourArray)
    console.log(queryURL);

    // If queryURL is error, we have encountered some previously unseen datatypes. In this case we just print an error.
    if (queryURL === "ERROR") {
      alert("Unsupported datatype in selected neighbours. Please select some other neighbours.")
    }

    // Else we run the body of the funnction

    else {
      document.body.classList.add('waiting');

      let promiseArray = [fetchJSON(queryURL)];

      allPromiseReady(promiseArray).then((values) => {
        // let's first work with the first promise result: fill in table data with the entities we have fetched
  
        // console.log(values[0].results.bindings);

        // We set the tableHeader[0] here, from a deep copy of tableHeader
        // tableHeader[0] should be set as neighbourArray
        let tableHeader = _.cloneDeep(this.state.tableHeader);
        tableHeader[0] = neighbourArray;
  
        // This part sets the data for each cell
        let tableData = _.cloneDeep(this.state.tableData);
  
        if (this.state.tableHeader[0].length === 0) {
          tableData = setFirstColumnData(
            values[0].results.bindings,
            tableData,
            tableHeader,
            colIndex
          )
        }
  
        // console.log(tableData);
  
        // We need to make modification here: find neighbours of a column, instead of neighbours of a cell
        // To do this, we need to use this tableData to ask more queries (number of queires is equal to tableData.length)
        let promiseArrayOne = this.getNeighbourPromise(tableData, "subject", colIndex);
        let promiseArrayTwo = this.getNeighbourPromise(tableData, "object", colIndex);
        allPromiseReady(promiseArrayOne).then((valuesOne) => {
        allPromiseReady(promiseArrayTwo).then((valuesTwo) => {
  
          // console.log(valuesOne);
          // console.log(valuesTwo);
  
          // To support the firstDegNeighbours prefetching, let's store the first degree neighbours in state firstDegNeighbours
          let firstDegNeighbours = {};
  
          // First we deal with subject neighbours, so valuesOne
          let subjectNeighbourArray = [];
          for (let i = 0; i < valuesOne.length; ++i) {
            let temp = updateKeyColNeighbours(
              [],
              valuesOne[i].results.bindings,
              "subject"
            )
            subjectNeighbourArray.push(temp);
          }
          firstDegNeighbours["subject"] = storeFirstDeg(subjectNeighbourArray);
          let processedSubjectNeighbours = processAllNeighbours(subjectNeighbourArray);
          processedSubjectNeighbours = addRecommendNeighbours(processedSubjectNeighbours);
          // Need modification here
  
          // Then we deal with object neighbours, so valuesTwo
          let objectNeighbourArray = [];
          for (let i = 0; i < valuesTwo.length; ++i) {
            let temp = updateKeyColNeighbours(
              [],
              valuesTwo[i].results.bindings,
              "object"
            )
            objectNeighbourArray.push(temp);
          }
          firstDegNeighbours["object"] = storeFirstDeg(objectNeighbourArray);
          let processedObjectNeighbours = processAllNeighbours(objectNeighbourArray);
          processedObjectNeighbours = addRecommendNeighbours(processedObjectNeighbours);
          // Need modification here
  
          // console.log(processedSubjectNeighbours);
          // console.log(processedObjectNeighbours);
          // console.log(firstDegNeighbours);
  
          // we now concat subjectNeighbours and objectNeighbours together
          let keyColNeighbours = processedSubjectNeighbours.concat(processedObjectNeighbours);
  
          // console.log(keyColNeighbours);
  
          let optionsMap = this.state.optionsMap.slice();
          for (let i = 0; i < optionsMap.length; ++i) {
            if (i !== colIndex) {
              optionsMap[i] = keyColNeighbours;
            }
          }
  
          // Support for undo: 
          // Let's save the previous state in an object
          let lastAction = "populateKeyColumn";
          let prevState = 
            {
              "keyColIndex":this.state.keyColIndex,
              "keyColNeighbours":this.state.keyColNeighbours,
              "firstDegNeighbours":this.state.firstDegNeighbours,
              "curActionInfo":this.state.curActionInfo,
              "tableData":this.state.tableData,
              "tableHeader":this.state.tableHeader,
              "optionsMap":this.state.optionsMap,
              "firstColFilled":this.state.firstColFilled,
            };
  
          document.body.classList.remove('waiting');
  
          this.setState({
            keyColIndex: colIndex,
            keyColNeighbours: keyColNeighbours,
            firstDegNeighbours: firstDegNeighbours,
            curActionInfo: {"task":"afterPopulateColumn"},
            tableData: tableData,
            tableHeader: tableHeader,
            firstColFilled: true,
            optionsMap: optionsMap,
            lastAction: lastAction,
            prevState: prevState,
          });
        })
        })
      });
    }
  }

  // // TEST FUNCTION----------------------------------------------------

  // getOtherColPromiseTwo(neighbour, type) {
  //   let promiseArray = [];
  //   // The following is the query we will make

  //   // SELECT ?key ?val
  //   // WHERE{
  //   //       ?key (dbo:spouse|dbp:spouse) ?val.
  //   //       VALUES ?key {dbr:Barack_Obama dbr:Ronald_Reagan dbr:Donald_Trump }
  //   // }


  //   let prefixURL = 
  //     "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
  //   let suffixURL = 
  //     "%7D%0D%0A%7D%0D%0A&format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=300000&debug=on&run=+Run+Query+";
  //   let queryBody;
  //   // This clause handles the case of "Obama -> property -> object"
  //   if (type === "subject") {
  //     queryBody = 
  //       "SELECT+%3Fkey+%3Fval%0D%0AWHERE%7B%0D%0A++++++%3Fkey+%28dbo%3A" +
  //       regexReplace(neighbour) +
  //       "%7Cdbp%3A" +
  //       regexReplace(neighbour) +
  //       "%29+%3Fval.%0D%0A++++++VALUES+%3Fkey+%7B";
  //   } 
  //   // This clause handles the case of "subject -> property -> Obama"
  //   else {
  //     queryBody = 
  //       "SELECT+%3Fkey+%3Fval%0D%0AWHERE%7B%0D%0A++++++%3Fval+%28dbo%3A" +
  //       regexReplace(neighbour) +
  //       "%7Cdbp%3A" +
  //       regexReplace(neighbour) +
  //       "%29+%3Fkey.%0D%0A++++++VALUES+%3Fkey+%7B";
  //   }
  //   for (let i = 0; i < this.state.tableData.length; ++i) {
  //     let cellValue = regexReplace(
  //       this.state.tableData[i][this.state.keyColIndex].data
  //     );
  //     // N/A's will block the search, let's replace it with some string that does not block the search
  //     if (cellValue === "N/A") {
  //       cellValue = "NONEXISTINGSTRING";
  //     }
  //     let curQueryText = "dbr%3A"+cellValue+"+";
  //     queryBody+=curQueryText;
  //   }
  //   let queryURL = prefixURL + queryBody + suffixURL;
  //   // console.log(queryURL);
  //   promiseArray.push(fetchJSON(queryURL));
  //   return promiseArray;
  // }

  // The following function serves as a helper function for "populateOtherColumn" and "populateSameNeighbour"
  // It makes an array of queries, which may affect the performance of our system. Let's change it now.

  getOtherColPromise(neighbour, type) {
    let promiseArray = [];
    let prefixURL =
      "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    let suffixURL =
      "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    for (let i = 0; i < this.state.tableData.length; ++i) {
      let cellValue = regexReplace(
        this.state.tableData[i][this.state.keyColIndex].data
      );
      // N/A's will block the search, let's replace it with some string that does not block the search
      if (cellValue === "N/A") {
        cellValue = "NONEXISTINGSTRING";
      }
      let queryBody;
      if (type === "subject") {
        queryBody =
          "SELECT+%3Fsomevar%0D%0AWHERE+%7B%0D%0A++++++++dbr%3A" +
          cellValue +
          "+%28dbo%3A" +
          regexReplace(neighbour) +
          "%7Cdbp%3A" +
          regexReplace(neighbour) +
          "%29+%3Fsomevar.%0D%0A%7D%0D%0A%0D%0A&";
      } else {
        queryBody =
          "SELECT+%3Fsomevar+%0D%0AWHERE+%7B%0D%0A++++++++%3Fsomevar+%28dbo%3A" +
          regexReplace(neighbour) +
          "%7Cdbp%3A" +
          regexReplace(neighbour) +
          "%29+dbr%3A" +
          cellValue +
          "%0D%0A%7D%0D%0A&";
      }
      let queryURL = prefixURL + queryBody + suffixURL;
      let curPromise = fetchJSON(queryURL);
      promiseArray.push(curPromise);
    }
    return promiseArray;
  }

  // document.body.classList.add('waiting');

  // console.log(neighbourIndex);

  // Support for "populateSameRange":

  // When the range is not equal to undefined, we want to ask user if they want to populate all other attributes from this range
  // console.log(range);

  // we need to make a number of queries in the form of: dbr:somekeycolumnentry dbp:neighbour|dbo:neighbour somevar
  // let promiseArrayTwo = this.getOtherColPromiseTwo(neighbour, type); // this is for testing
  // let promiseArray = this.getOtherColPromise(neighbour, type);

  // allPromiseReady(promiseArray).then((values) => {
  // // allPromiseReady(promiseArrayTwo).then((testValues) => {

  // //   // Let's compare the different values we get from getOtherColPromise and getOtherColPromiseTwo
  // //   console.log(values);
  // //   console.log(testValues);

  // //   // Now we need to process the testValues

  // //   let pairArray = [];

  // //   // First we removed the prefixes from resultArray
  // //   for (let i=0; i<testValues[0].results.bindings.length; ++i) {
  // //     pairArray.push(
  // //       {
  // //         "key":removePrefix(testValues[0].results.bindings[i].key.value),
  // //         "value":removePrefix(testValues[0].results.bindings[i].val.value)
  // //       }
  // //     )
  // //   }
  // //   console.log(pairArray);

  // //   // Then we create a keyArray
  // //   let keyArray = [];

  // //   for (let i=0; i<this.state.tableData.length; ++i) {
  // //     keyArray.push(this.state.tableData[i][this.state.keyColIndex].data);
  // //   }
  // //   console.log(keyArray);
  populateOtherColumn(e, colIndex, neighbourArray) {

    // console.log(colIndex);
    // console.log(neighbourArray);

    let tableData = _.cloneDeep(this.state.tableData);
    let longestColumnArray = [];
    for (let i = 0; i < tableData.length; ++i) {
      // curColumnArray is the dataArray for each entry in search column, for all neighbours in neighbourArray.
      let curColumnArray = [];
      // We loop through the neighbourArray
      for (let j = 0; j < neighbourArray.length; ++j) {
        // For each neighbour in neighbourArray, we check to see if entries in search column have values for this neighbour
        let curNeighbour = neighbourArray[j];
        let firstDegNeighbours = 
          curNeighbour.type === "subject" ? this.state.firstDegNeighbours.subject : this.state.firstDegNeighbours.object;
        let curNeighbourData = firstDegNeighbours[i][curNeighbour.value];
        // If yes, we want to concat those values with curColumnArray
        if (curNeighbourData !== undefined) {
          curColumnArray = curColumnArray.concat(curNeighbourData);
        }
      }
      // If curColumnArray is empty, that means this entry in searchColumn do not have any of the attributes from neighbourArray
      if (curColumnArray.length === 0) {
        tableData[i][colIndex].data = "N/A";
      }
      // Otherwise, we have found at least one value.
      else {
        // we first set the data for the cell using curColumnArray[0]
        tableData[i][colIndex].data = curColumnArray[0];
        // we then set origin for the cell. Need to use neighbourArray to get the correct text for the origin
        let originToAdd = createNeighbourText(neighbourArray) + ":" + curColumnArray[0];
        let keyOrigin = tableData[i][this.state.keyColIndex].origin.slice();
        keyOrigin.push(originToAdd);
        tableData[i][colIndex].origin = keyOrigin;
        // console.log(keyOrigin)
        // If curColumnArray's length is longer than longestColumnArray's length, we want to update it
        if (curColumnArray.length > longestColumnArray.length) {
          longestColumnArray = curColumnArray;
        }
      }
    }
    // Now, we are done with updating tableData.

    // We start setting up the content for the Action Panel.
    // console.log(longestColumnArray);
    let maxCount = Math.min(longestColumnArray.length, maxNeighbourCount);
    let remainNeighbourCount = maxCount - 1;
    // console.log(remainNeighbourCount);

    let recommendArray = createRecommendArray(neighbourArray);
    // console.log(recommendArray);

    // tempObj stores the information passed to ActionPanel
    let tempObj = {};

    // If remainNeighbourCount is larger than 0, we give users the option to populate duplicate neighbours
    if (remainNeighbourCount > 0) {
      tempObj["task"] = "populateSameNeighbour";
      tempObj["colIndex"] = colIndex;
      tempObj["neighbourArray"] = neighbourArray;
      tempObj["numCols"] = remainNeighbourCount;
    }
    // Else, this column has no multiple values. Let's check if we can make some suggestions.
    else if (recommendArray.length > 0) {
      tempObj["task"] = "populateRecommendation";
      tempObj["colIndex"] = colIndex;
      tempObj["recommendArray"] = recommendArray; 
    }
    // In this case, we have no suggestions to make, so We simply tell users that they can populate more columns. 
    else {
      tempObj["task"] = "afterPopulateColumn";
    }

    // Support for undo: 
    // Let's save the previous state in an object
    let lastAction = "populateOtherColumn";
    let prevState = 
      {
        "curActionInfo":this.state.curActionInfo,
        "tableData":this.state.tableData,
      };

    this.setState({
      curActionInfo: tempObj,
      tableData: tableData,
      lastAction: lastAction,
      prevState: prevState,
    });


    // let tableData = _.cloneDeep(this.state.tableData);
    // let firstDegNeighbours = type === "subject" ? this.state.firstDegNeighbours.subject : this.state.firstDegNeighbours.object;
    // let longestDataArray = [];
    // for (let i = 0; i < tableData.length; ++i) {
    //   let dataArray = firstDegNeighbours[i][neighbour];
    //   // console.log(dataArray);
    //   // If dataArray is empty, this current entry in search column does not have this neighbour at all.
    //   if (dataArray === undefined) {
    //     tableData[i][colIndex].data = "N/A";
    //   } 
    //   // Otherwise, we have found at least one value. Let's use dataArray[0]
    //   else {
    //     // we first set data for the cell
    //     tableData[i][colIndex].data = dataArray[0];
    //     // we then set origin for the cell. The origin depends on whether type is "subject" or "object"
    //     let originToAdd = type === "subject" ? neighbour + ":" + dataArray[0] : "is " + neighbour + " of:" + dataArray[0];
    //     let keyOrigin = tableData[i][this.state.keyColIndex].origin.slice();
    //     keyOrigin.push(originToAdd);
    //     tableData[i][colIndex].origin = keyOrigin;
    //     // If dataArray's length is longer than longestDataArray's length, we want to update it
    //     if (dataArray.length > longestDataArray.length) {
    //       longestDataArray = dataArray;
    //     }
    //   }
    // }
    // // console.log(longestDataArray);
    // let maxCount = Math.min(longestDataArray.length, maxNeighbourCount);
    // let remainNeighbourCount = maxCount - 1;

    // console.log(remainNeighbourCount);
    
    // // Now we set up the content for ActionPanel
    // let tempObj = {};

    // // In this case, we give users option to populate duplicate neighbours
    // if (remainNeighbourCount > 0) {
    //   tempObj["task"] = "populateSameNeighbour";
    //   tempObj["colIndex"] = colIndex;
    //   tempObj["neighbour"] = neighbour;
    //   tempObj["type"] = type;
    //   tempObj["numCols"] = remainNeighbourCount;
    //   if (range !== undefined) {
    //     tempObj["range"] = range;
    //   }
    // }
    // // In this case, users are not populating column with duplicate names, but it has a range.
    // // We may need to ask user if they want to populate other columns from the same range
    // else if (range !== undefined) {
    //   let siblingNeighbour = [];
    //   // console.log("Range is "+range);
    //   // console.log(this.state.keyColNeighbours);
    //   for (let i = 0; i < this.state.keyColNeighbours.length; ++i) {
    //     if (
    //       this.state.keyColNeighbours[i].range === range &&
    //       this.state.keyColNeighbours[i].value !== neighbour
    //     ) {
    //       siblingNeighbour.push(this.state.keyColNeighbours[i]);
    //     }
    //   }
    //   // If we have found columns from the same range (other than the current neighbour),
    //   console.log(siblingNeighbour);
    //   // If sibling neighbour is non-empty, we give user the option to populate other columns from the same range.
    //   if (siblingNeighbour.length > 0) {
    //     // Let's do some string processing to improve UI clarity
    //     let rangeLiteral = "";
    //     if (range.includes("http://dbpedia.org/ontology/")) {
    //       rangeLiteral = range.slice(28);
    //     } else if (range.includes("http://www.w3.org/2001/XMLSchema#")) {
    //       rangeLiteral = range.slice(33);
    //     } else {
    //       rangeLiteral = range;
    //     }
    //     tempObj["task"] = "populateSameRange";
    //     tempObj["colIndex"] = colIndex;
    //     tempObj["range"] = rangeLiteral;
    //     // console.log(siblingNeighbour);
    //     tempObj["siblingNeighbour"] = siblingNeighbour;
    //   }
    //   // Else, if we have NOT found anything from the same range, we tell user that they can populate more columns
    //   else {
    //     tempObj["task"] = "afterPopulateColumn";
    //   }
    // }
    // // In this case, we tell users that they can populate more columns
    // else {
    //   tempObj["task"] = "afterPopulateColumn";
    // }
    // // Support for undo: 
    // // Let's save the previous state in an object
    // let lastAction = "populateOtherColumn";
    // let prevState = 
    //   {
    //     "curActionInfo":this.state.curActionInfo,
    //     "tableData":this.state.tableData,
    //   };

    // this.setState({
    //   curActionInfo: tempObj,
    //   tableData: tableData,
    //   lastAction: lastAction,
    //   prevState: prevState,
    // });
  }

  // This function is a helper function that takes in 9 parameters:
  // Note: this function does not make any fetch requests, thus does NOT involve promises.

  // 1) colIndex:          index of the column that we just filled (ex. 1, if we just filled in column 1)
  // 2) neighbourArray:    an array of neighbour objects (two important attributes: value, type)
  // 3) numCols:           number of columns that we need to fill with the duplicated neighbour. (ex. 2, if we have filled in one almaMater, but there are three in total)
  
  // 4) keyColIndex:                 original key column index
  // 5) tableHeader:                 original tableHeader
  // 6) tableData:                   original tableData
  // 7) optionsMap:                  original optionsMap
  // 8) selectedClassAnnotation:     original selectedClassAnnotation

  // 9) fillRecommendation:              When true, decrement requiredLength in code by 1.

  // and returns an object with 5 values:
  // 1) tableHeader:                tableHeader after modification
  // 2) tableData:                  tableData after modification
  // 3) optionsMap:                 optionsMap after modification
  // 4) selectedClassAnnotation:    selectedClassAnnotation after modification
  // 5) keyColIndex:                keyColIndex after modification

  addAllNeighbour(
    colIndex,
    neighbourArray,
    numCols,
    keyColIndex,
    tableHeader,
    tableData,
    optionsMap,
    selectedClassAnnotation,
    fillRecommendation
  ) {
    // Let's first check if all the variables are as expected

    // console.log("Column index is: "+colIndex);
    // console.log("NeighbourArray is: ");
    // console.log(neighbourArray);
    // console.log("Number of columns to fill is: "+numCols);
    // console.log("Key column index "+keyColIndex);
    // console.log("Table header is: ");
    // console.log(tableHeader);
    // console.log("Table Data is: ");
    // console.log(tableData);
    // console.log("Options map is: ");
    // console.log(optionsMap);
    // console.log("selected class annotation is ");
    // console.log(selectedClassAnnotation);
    // console.log("End of attributes check\n\n\n\n");

    // Now we need to write the body for this function

    // First thing should be to insert "numCols" number of empty columns right after column with index "colIndex"
    const rowNum = tableData.length;
    const colNum = tableData[0].length;

    // Let's check if we need to modify keyColIndex:
    // if colIndex < keyColIndex, we need to increase keyColIndex by numCols
    let keyColIndexUpdated = keyColIndex;
    if (colIndex < keyColIndex) {
      keyColIndexUpdated+=numCols;
    }
    // console.log("Updated key column index is "+keyColIndexUpdated);

    // We first take care of table data's (empty) additions
    let tableDataUpdated = [];
    for (let i = 0; i < rowNum; ++i) {
      let tempRow = [];
      for (let j = 0; j < colIndex + 1; ++j) {
        tempRow.push(tableData[i][j]);
      }
      // we add in numCols number of empty columns
      for (let j = 0; j < numCols; ++j) {
        tempRow.push({ data: "", origin: [] });
      }
      for (let k = colIndex + 1; k < colNum; ++k) {
        tempRow.push(tableData[i][k]);
      }
      tableDataUpdated.push(tempRow);
    }
    // console.log("Updated table data is ");
    // console.log(tableDataUpdated);

    // we now take care of table header's addition.
    let tableHeaderUpdated = [];
    for (let j = 0; j < colIndex + 1; ++j) {
      tableHeaderUpdated.push(tableHeader[j]);
    }
    // Now we decide what the newly pushed tableHeader should look like
    let newTableHeader;
    // If we are not populating new suggestions, we simply use tableHeader[colIndex]
    if (fillRecommendation === false) {
      newTableHeader = tableHeader[colIndex];
    }
    // else, it is an length one array of object. Object has 2 properties: value and label
    else {
      // We need to figure out what this label is
      let keyColLabel = "";
      for (let i = 0; i < tableHeader[keyColIndex].length; ++i) {
        let labelToAdd = i > 0 ? "&" + tableHeader[keyColIndex][i].label : tableHeader[keyColIndex][i].label;
        keyColLabel+=labelToAdd;
      }
      let ownLabel = neighbourArray[0].type === "subject" ? neighbourArray[0].value : "is " + neighbourArray[0].value + " of";
      newTableHeader = [
        {
          "value" : neighbourArray[0].value,
          "label" : ownLabel + "--" + keyColLabel
        }
      ]
    }
    for (let j = 0; j < numCols; ++j) {
      tableHeaderUpdated.push(newTableHeader);
    }
    for (let k = colIndex + 1; k < colNum; ++k) {
      tableHeaderUpdated.push(tableHeader[k]);
    }
    // console.log("Updated table header is ");
    // console.log(tableHeaderUpdated);

    // We now take care of selectedClassAnnotation. For now, we just add some empty arrays to it
    let selectedClassAnnotationUpdated = [];
    for (let j = 0; j < colIndex; ++j) {
      selectedClassAnnotationUpdated.push(selectedClassAnnotation[j]);
    }
    for (let j = 0; j < numCols; ++j) {
      selectedClassAnnotationUpdated.push([]);
    }
    for (let k = colIndex; k < colNum-1; ++k) {
      selectedClassAnnotationUpdated.push(selectedClassAnnotation[k]);
    }
    // console.log("Updated class annotation is ");
    // console.log(selectedClassAnnotationUpdated);

    // we now take care of optionMap's addition. We just need to add some empty arrays to it
    let optionsMapUpdated = [];
    for (let j = 0; j < colIndex + 1; ++j) {
      optionsMapUpdated.push(optionsMap[j]);
    }
    for (let j = 0; j < numCols; ++j) {
      optionsMapUpdated.push([]);
    }
    for (let k = colIndex + 1; k < colNum; ++k) {
      optionsMapUpdated.push(optionsMap[k]);
    }
    // console.log("Updated options map is ");
    // console.log(optionsMapUpdated);

    // Finally, we fill in the actual data for tableData. We need to take care of both data and origin

    // Outer loop loops over all rows in the table
    for (let i = 0; i < tableData.length; ++i) {
      // curColumnArray corresponds to the dataArray for each entry from the search column
      let curColumnArray = [];
      // we loop through the neighbourArray
      for (let j = 0; j < neighbourArray.length; ++j) {
        // For each neighbour in neighbourArray, we check to see if entries in search column have values for this neighbour
        let curNeighbour = neighbourArray[j];
        let firstDegNeighbours =
          curNeighbour.type === "subject" ? this.state.firstDegNeighbours.subject : this.state.firstDegNeighbours.object;
        let curNeighbourData = firstDegNeighbours[i][curNeighbour.value];
        // If yes, we want to concat those values with curColumnArray
        if (curNeighbourData !== undefined) {
          curColumnArray = curColumnArray.concat(curNeighbourData);
        }
      }
      // console.log(curColumnArray);
      for (let curCol = colIndex + 1; curCol < colIndex + 1 + numCols; ++curCol) {
        // Starting value for requiredLength is 2
        let requiredLength = fillRecommendation === true ? curCol - colIndex : curCol - colIndex + 1;
        // If curColumnArray's length does not meet the required length, we simply set data to N/A
        if (curColumnArray.length < requiredLength) {
          tableDataUpdated[i][curCol].data = "N/A";
        }
        else {
          // We first set the data of the cell
          let value = curColumnArray[requiredLength - 1];
          tableDataUpdated[i][curCol].data = value;
          // We then set the origin of the cell
          let originToAdd = createNeighbourText(neighbourArray) + ":" + value;
          let keyOrigin = tableDataUpdated[i][keyColIndexUpdated].origin.slice();
          keyOrigin.push(originToAdd);
          tableDataUpdated[i][curCol].origin = keyOrigin;
        }
      }
    }

    return {
      tableHeader: tableHeaderUpdated,
      tableData: tableDataUpdated,
      optionsMap: optionsMapUpdated,
      selectedClassAnnotation: selectedClassAnnotationUpdated,
      keyColIndex: keyColIndexUpdated,
    };
  }

  // This function populates all neighbour with the same names in different columns, if that neighbour has multiple occurences.

  // It takes in 6 parameters:
  // 1) colIndex:        index of the column that we just filled     (ex. 1, if we just filled in column 1)
  // 2) neighbour:       attribute name of the column we just filled (ex. almaMater)
  // 3) neighbourIndex:  index of the attribute we just filled       (ex. 0, if we have filled in almaMater-1)
  // 4) type:            type of the attribute. Either "subject" or "object"
  // 5) numCols:         number of columns that we need to fill with the duplicated neighbour. (ex. 2, if we have filled in one almaMater, but there are three in total)
  // 6) range:           range for the neighbour to be filled (ex: Person for vicePresident)
  
  // Note: currently it only populates "later" neighbour with same name.

  sameNeighbourDiffCol(e,colIndex,neighbourArray,numCols) {

    let newState = this.addAllNeighbour(colIndex,
                                        neighbourArray,
                                        numCols,
                                        this.state.keyColIndex,
                                        this.state.tableHeader,
                                        this.state.tableData,
                                        this.state.optionsMap,
                                        this.state.selectedClassAnnotation,
                                        false);
    // console.log(newState);

    // Now we set up the obj for Action Panel
    let tempObj = {};
    let recommendArray = createRecommendArray(neighbourArray);
    if (recommendArray.length > 0) {
      tempObj["task"] = "populateRecommendation";
      tempObj["colIndex"] = colIndex + numCols;
      tempObj["recommendArray"] = recommendArray; 
    }
    else {
      tempObj["task"] = "afterPopulateColumn";
    }

    // Support for undo: 
    // Let's save the previous state in an object
    let lastAction = "sameNeighbourDiffCol";
    let prevState = 
      {
        "curActionInfo":this.state.curActionInfo,
        "tableData":this.state.tableData,
        "tableHeader":this.state.tableHeader,
        "optionsMap":this.state.optionsMap,
        "selectedClassAnnotation":this.state.selectedClassAnnotation,
        "keyColIndex":this.state.keyColIndex,
      };

    this.setState({
      curActionInfo:tempObj,
      tableData:newState.tableData,
      tableHeader:newState.tableHeader,
      optionsMap:newState.optionsMap,
      selectedClassAnnotation:newState.selectedClassAnnotation,
      keyColIndex:newState.keyColIndex,
      lastAction: lastAction,
      prevState: prevState,
    })
  }

  // This function populates all neighbour with the same names in the same columns, if that neighbour has multiple occurences.

  sameNeighbourOneCol(e, colIndex, neighbourArray) {
    // console.log(colIndex);
    // console.log(neighbourArray);
    // console.log(numCols);

    let tableData = _.cloneDeep(this.state.tableData);

    // Outer loop loops over all rows in the table
    for (let i = 0; i < tableData.length; ++i) {
      // curColumnArray corresponds to the dataArray for each entry from the search column
      let curColumnArray = [];
      // we loop through the neighbourArray
      for (let j = 0; j < neighbourArray.length; ++j) {
        // For each neighbour in neighbourArray, we check to see if entries in search column have values for this neighbour
        let curNeighbour = neighbourArray[j];
        // console.log(curNeighbour.value);
        let firstDegNeighbours =
          curNeighbour.type === "subject" ? this.state.firstDegNeighbours.subject : this.state.firstDegNeighbours.object;
        let curNeighbourData = firstDegNeighbours[i][curNeighbour.value];
        // console.log(firstDegNeighbours);
        // If yes, we want to concat those values with curColumnArray
        if (curNeighbourData !== undefined) {
          // console.log(curNeighbourData);
          curColumnArray = curColumnArray.concat(curNeighbourData);
        }
      }
      // console.log(curColumnArray);
      // If curColumnArray is empty, that means this entry in searchColumn do not have any of the attributes from neighbourArray
      if (curColumnArray.length === 0) {
        tableData[i][colIndex].data = "N/A";
      }
      // Otherwise, we have found at least one value. And we want to set up the data and origin. 
      else {
        // we first set the data for the cell using all values from curColumnArray (this is different from populateOtherColumn)
        let curData = "";
        for (let k = 0; k < curColumnArray.length; ++k) {
          let dataToAdd = k > 0 ? ";" + curColumnArray[k] : curColumnArray[k];
          curData+=dataToAdd;
          // console.log("Data to add is "+dataToAdd);
          // console.log("Current data is "+curData);
        }
        tableData[i][colIndex].data = curData;
        // we then set the origin for the cell
        let originToAdd = createNeighbourText(neighbourArray) + ":" + curData;
        let keyOrigin = tableData[i][this.state.keyColIndex].origin.slice();
        keyOrigin.push(originToAdd);
        tableData[i][colIndex].origin = keyOrigin;
      }
    }

    // Now we set up the obj for Action Panel
    let tempObj = {};
    let recommendArray = createRecommendArray(neighbourArray);
    if (recommendArray.length > 0) {
      tempObj["task"] = "populateRecommendation";
      tempObj["colIndex"] = colIndex;
      tempObj["recommendArray"] = recommendArray; 
    }
    else {
      tempObj["task"] = "afterPopulateColumn";
    }

    // Support for undo: 
    let lastAction = "sameNeighbourOneCol";
    let prevState = 
      {
        "curActionInfo":this.state.curActionInfo,
        "tableData":this.state.tableData,
      };

    this.setState({
      curActionInfo: tempObj,
      tableData: tableData,
      lastAction: lastAction,
      prevState: prevState,
    });
  }

  // // The following function populates all neighbour from the same range (ex. all neighbours with rdfs:range Person)
  // // This function should use addAllNeighbour as a helper function
  // populateSameRange(e, colIndex, range, siblingNeighbour) {

  //   // console.log("Column index is "+colIndex);
  //   // console.log("Range is "+range);
  //   // console.log("Sibling neighbours are: ");
  //   // console.log(siblingNeighbour);

  //   // first we fetch the initial state of tableHeader, tableData, optionsMap, selectedClassAnnotation, keyColIndex, and curColIndex
  //   let tempHeader = this.state.tableHeader;
  //   let tempData = this.state.tableData;
  //   let tempOptions = this.state.optionsMap;
  //   let tempAnnotation = this.state.selectedClassAnnotation;
  //   let tempKeyColIndex = this.state.keyColIndex;
  //   let curColIndex = colIndex;

  //   for (let i = 0; i < siblingNeighbour.length; ++i) {
  //     let newState = this.addAllNeighbour(curColIndex,
  //                                         siblingNeighbour[i].value,
  //                                         "subject",
  //                                         siblingNeighbour[i].count,
  //                                         tempKeyColIndex,
  //                                         tempHeader,
  //                                         tempData,
  //                                         tempOptions,
  //                                         tempAnnotation,
  //                                         true);
  //     curColIndex+=siblingNeighbour[i].count;
  //     tempHeader = newState.tableHeader;
  //     tempData = newState.tableData;
  //     tempOptions = newState.optionsMap;
  //     tempAnnotation = newState.selectedClassAnnotation;
  //     tempKeyColIndex = newState.keyColIndex;
  //   }

  //   // Support for undo: 
  //   let lastAction = "populateSameRange";
  //   let prevState = 
  //     {
  //       "curActionInfo":this.state.curActionInfo,
  //       "tableData":this.state.tableData,
  //       "tableHeader":this.state.tableHeader,
  //       "optionsMap":this.state.optionsMap,
  //       "selectedClassAnnotation":this.state.selectedClassAnnotation,
  //       "keyColIndex":this.state.keyColIndex,
  //     };

  //   this.setState({
  //     curActionInfo:{"task":"afterPopulateColumn"},
  //     tableData:tempData,
  //     tableHeader:tempHeader,
  //     optionsMap:tempOptions,
  //     selectedClassAnnotation:tempAnnotation,
  //     keyColIndex:tempKeyColIndex,
  //     lastAction:lastAction,
  //     prevState:prevState,
  //   })
  // }

  // The following function populates one recommendation neighbour
  populateRecommendation(e, colIndex, neighbourArray) {
    console.log(colIndex);
    console.log(neighbourArray);
    let numCols = 0;
    // We need to figure out what numCols should be, based on firstDegNeighbours
    let firstDegNeighbours = neighbourArray[0].type === "subject" ? this.state.firstDegNeighbours.subject : this.state.firstDegNeighbours.object;
    for (let i = 0; i < firstDegNeighbours.length; ++i) {
      let neighbourData = firstDegNeighbours[i][neighbourArray[0].value];
      if (neighbourData !== undefined && neighbourData.length > numCols) {
        numCols = neighbourData.length;
      }
    }
    // console.log(numCols);
    // At this stage, we have gathered all the parameters needed for addAllNeighbours
    let newState = this.addAllNeighbour(colIndex,
                                        neighbourArray,
                                        numCols,
                                        this.state.keyColIndex,
                                        this.state.tableHeader,
                                        this.state.tableData,
                                        this.state.optionsMap,
                                        this.state.selectedClassAnnotation,
                                        true);
    // console.log(newState);

    let curActionInfo = _.cloneDeep(this.state.curActionInfo);
    curActionInfo["colIndex"]+=numCols;

    // Support for undo:
    let lastAction = "populateRecommendation";
    let prevState = 
      {
        "tableData":this.state.tableData,
        "tableHeader":this.state.tableHeader,
        "optionsMap":this.state.optionsMap,
        "selectedClassAnnotation":this.state.selectedClassAnnotation,
        "keyColIndex":this.state.keyColIndex,
        "curActionInfo":this.state.curActionInfo,
      };
    this.setState({
      tableData:newState.tableData,
      tableHeader:newState.tableHeader,
      optionsMap:newState.optionsMap,
      selectedClassAnnotation:newState.selectedClassAnnotation,
      keyColIndex:newState.keyColIndex,
      curActionInfo:curActionInfo,
      lastAction: lastAction,
      prevState: prevState,
    })
  }

  // The following function adds a new column to the table, to the right of the context-menu clicked column.
  // In here, let's also set tabIndex to 0.

  contextAddColumn(e, colIndex) {
    const rowNum = this.state.tableData.length;
    const colNum = this.state.tableData[0].length;

    // we first take care of table data's addition
    let tableData = [];
    for (let i = 0; i < rowNum; ++i) {
      let tempRow = [];
      for (let j = 0; j < colIndex + 1; ++j) {
        tempRow.push(this.state.tableData[i][j]);
      }
      // we add in one column of empty data
      tempRow.push({ data: "", origin: [] });
      for (let k = colIndex + 1; k < colNum; ++k) {
        tempRow.push(this.state.tableData[i][k]);
      }
      tableData.push(tempRow);
    }

    // we now take care of tabler header, optionMap, and selectedClassAnnotation's addition
    // This added column will have options equal to the neighbours of the key column
    let optionsMap = [];
    let tableHeader = [];
    for (let j = 0; j < colIndex + 1; ++j) {
      optionsMap.push(this.state.optionsMap[j]);
      tableHeader.push(this.state.tableHeader[j]);
    }
    optionsMap.push(this.state.keyColNeighbours);
    tableHeader.push("");
    for (let k = colIndex + 1; k < colNum; ++k) {
      optionsMap.push(this.state.optionsMap[k]);
      tableHeader.push(this.state.tableHeader[k]);
    }

    // we now take care of selectedClassAnnotation
    let selectedClassAnnotation = [];
    for (let j = 0; j < colIndex; ++j) {
      selectedClassAnnotation.push(this.state.selectedClassAnnotation[j]);
    }
    selectedClassAnnotation.push([]);
    for (let k = colIndex; k < colNum-1; ++k) {
      selectedClassAnnotation.push(this.state.selectedClassAnnotation[k]);
    }

    // If colIndex is less than keyColIndex, we need to increase keyColIndex by 1
    let keyColIndex = this.state.keyColIndex;
    if (colIndex < keyColIndex) {
      ++keyColIndex;
    }

    // console.log(this.state.selectedClassAnnotation);
    // console.log(tableHeader);

    // Support for undo: 
    let lastAction = "contextAddColumn";
    let prevState = 
        {
          "tableData": this.state.tableData,
          "tableHeader": this.state.tableHeader,
          "curActionInfo": this.state.curActionInfo,
          "optionsMap": this.state.optionsMap,
          "keyColIndex": this.state.keyColIndex,
          "selectedClassAnnotation": this.state.selectedClassAnnotation,
          "tabIndex": this.state.tabIndex,
        };

    this.setState({
      tableData: tableData,
      tableHeader: tableHeader,
      curActionInfo: {"task":"afterPopulateColumn"},
      optionsMap: optionsMap,
      keyColIndex: keyColIndex,
      selectedClassAnnotation: selectedClassAnnotation,
      tabIndex: 0, // we want to set the currently active tab to be wrangling actions
      lastAction: lastAction,
      prevState: prevState,
    });
  }
  
  // The following function handles the deletion of a column from context menu.
  // This function should be largely similar to contextAddColumn

  contextDeleteColumn(e, colIndex) {
    // console.log("This is the column we are trying to delete "+colIndex);

    // We disable the deletion of the search column
    if (colIndex === this.state.keyColIndex) {
      alert("The current column is the search column.\n\nPlease set another search column before deleting the current column.");
    }

    // We also disable the deletion of the first column
    else if (colIndex === 0) {
      alert("Deleting the first column causes unexpected behavior.\n\nPlease do not delete the first column.");
    }

    // Else, we can proceed to deletion.
    else {
      // We handle tableData, tableHeader, optionsMap, and selectedClassAnnotation's deletion
      let tableData = _.cloneDeep(this.state.tableData);
      let tableHeader = this.state.tableHeader.slice();
      let optionsMap = this.state.optionsMap.slice();
      let selectedClassAnnotation = this.state.selectedClassAnnotation.slice();

      // tableData
      for (let i = 0; i < tableData.length; ++i) {
        tableData[i].splice(colIndex, 1);
      }
      // tableHeader, optionsMap, and selectedClassAnnotation
      tableHeader.splice(colIndex, 1);
      optionsMap.splice(colIndex, 1);
      if (colIndex > 0) {
        selectedClassAnnotation.splice(colIndex-1, 1);
      }
      // If colIndex is less than keyColIndex, we need to decrease keyColIndex by 1, if keyColIndex > 0
      let keyColIndex = this.state.keyColIndex;
      if (colIndex < keyColIndex) {
        --keyColIndex;
      }

      // When we are deleting a column, we do not necessarily want to go to tab 0.
      // However, if we are in tab 1, we want to toggle off all property neighbours
      let propertyNeighbours = _.cloneDeep(this.state.propertyNeighbours);
      if (this.state.tabIndex === 1) {
        for (let i = 0; i < propertyNeighbours.length; ++i) {
          propertyNeighbours[i].isOpen = false;
        }
      }

      // Support for undo: 
      let lastAction = "contextDeleteColumn";
      let prevState = 
          {
            "tableData": this.state.tableData,
            "tableHeader": this.state.tableHeader,
            "optionsMap": this.state.optionsMap,
            "selectedClassAnnotation": this.state.selectedClassAnnotation,
            "keyColIndex": this.state.keyColIndex,
            "propertyNeighbours": this.state.propertyNeighbours,
            "curActionInfo": this.state.curActionInfo,
          };

      this.setState({
        tableData: tableData,
        tableHeader: tableHeader,
        optionsMap: optionsMap,
        selectedClassAnnotation: selectedClassAnnotation,
        keyColIndex: keyColIndex,
        propertyNeighbours: propertyNeighbours,
        curActionInfo: {"task":"afterPopulateColumn"},
        lastAction: lastAction,
        prevState: prevState,
      });
    }
  }

  // The following function handles the sorting of a column from context menu.
  // It is a prototype. Needs to be refined in the future.

  contextSortColumn(e, colIndex, order) {
    // console.log("The column we are sorting is "+colIndex);
    let tableData = _.cloneDeep(this.state.tableData);

    // We first loop through this column to determine if it's a numeric column or a string column
    let numericCol = true;
    for (let i = 0; i < tableData.length; ++i) {
      // We only care about entries that are not N/A
      if (tableData[i][colIndex].data !== "N/A") {
        if (isNaN(Number(tableData[i][colIndex].data))) {
          numericCol = false;
          break;
        }
      }
    }

    // Let's also make a copy of the entry (row) containing the current search cell
    let searchEntry = tableData[this.state.keyEntryIndex].slice();

    // In this case we are sorting a numerical column
    if (numericCol) {
      tableData.sort(function (a, b) {
        let aValue = a[colIndex].data;
        let bValue = b[colIndex].data;
        // We want to put all N/A's at the bottom
        if (aValue === "N/A") {
          return 1;
        }
        else if (bValue === "N/A") {
          return -1;
        } 
        // Else, we sort by the given order.
        else {
          if (order === "ascending") {
            return Number(aValue) - Number(bValue);
          }
          else {
            return Number(bValue) - Number(aValue);
          }
        }
      });
    }
    // In this case we are sorting a string-based column
    else {
      tableData.sort(function (a, b) {
        let aValue = a[colIndex].data;
        let bValue = b[colIndex].data;
        // We want to put all N/A's at the bottom
        if (aValue === "N/A") {
          return 1;
        }
        else if (bValue === "N/A") {
          return -1;
        } 
        // Else, we sort by the given order.
        else {
          if (order === "ascending") {
            return aValue < bValue ? -1 : 1;
          }
          else {
            return aValue < bValue ? 1 : -1;
          }
        }
      });
    }
    // console.log("Table Data is: ");
    // console.log(tableData);
    // console.log("Search entry is ");
    // console.log(searchEntry);

    // Note: keyColIndex does not change with a sort. But keyEntryIndex may. 
    // Let's figure out what the updated keyEntryIndex should be.
    let keyEntryIndex;
    for (let i = 0; i < tableData.length; ++i) {
      let matchFound = true;
      for (let j = 0; j < searchEntry.length; ++j) {
        if (searchEntry[j].data !== tableData[i][j].data) {
          matchFound = false;
          break;
        }
      }
      if (matchFound === true) {
        keyEntryIndex = i;
        break;
      }
    }
    // console.log("Table Data is: ");
    // console.log(tableData);
    // console.log("Search entry is ");
    // console.log(searchEntry);
    // console.log("New key entry index is "+keyEntryIndex);

    // Support for undo: 
    let lastAction = "contextSortColumn";
    let prevState = 
        {
          "tableData": this.state.tableData,
          "keyEntryIndex": this.state.keyEntryIndex,
          "curActionInfo": this.state.curActionInfo,
        };

    this.setState({
      tableData: tableData,
      keyEntryIndex: keyEntryIndex,
      curActionInfo: {"task":"afterPopulateColumn"},
      lastAction: lastAction,
      prevState: prevState,
    });
  }

  // The following functions sets the selected column to be the search column.

  contextSetColumn(e, colIndex) {

    // console.log("Col index of search cell is "+colIndex);

    document.body.classList.add('waiting');

    // Code here should largely be similar to what we have in populateKeyColumn

    let tableData = _.cloneDeep(this.state.tableData);

    // We need to find neighbours of a column.
    // We need to use tableData to ask more queries (number of queries is equal to tableData.length)
    let promiseArrayOne = this.getNeighbourPromise(tableData, "subject", colIndex);
    let promiseArrayTwo = this.getNeighbourPromise(tableData, "object", colIndex);

    allPromiseReady(promiseArrayOne).then((valuesOne) => {
    allPromiseReady(promiseArrayTwo).then((valuesTwo) => {
      // console.log(valuesOne);
      // console.log(valuesTwo);

      // To support the firstDegNeighbours prefetching, let's store the first degree neighbours in state firstDegNeighbours
      let firstDegNeighbours = {};

      // First we deal with subject neighbours, so valuesOne
      let subjectNeighbourArray = [];
      for (let i = 0; i < valuesOne.length; ++i) {
        let temp = updateKeyColNeighbours(
          [],
          valuesOne[i].results.bindings,
          "subject"
        )
        subjectNeighbourArray.push(temp);
      }
      firstDegNeighbours["subject"] = storeFirstDeg(subjectNeighbourArray);
      let processedSubjectNeighbours = processAllNeighbours(subjectNeighbourArray);
      processedSubjectNeighbours = addRecommendNeighbours(processedSubjectNeighbours);
      // Need modification here

      // Then we deal with object neighbours, so valuesTwo
      let objectNeighbourArray = [];
      for (let i = 0; i < valuesTwo.length; ++i) {
        let temp = updateKeyColNeighbours(
          [],
          valuesTwo[i].results.bindings,
          "object"
        )
        objectNeighbourArray.push(temp);
      }
      firstDegNeighbours["object"] = storeFirstDeg(objectNeighbourArray);
      let processedObjectNeighbours = processAllNeighbours(objectNeighbourArray);
      processedObjectNeighbours = addRecommendNeighbours(processedObjectNeighbours);
      // Need modification here

      // console.log(processedSubjectNeighbours);
      // console.log(processedObjectNeighbours);

      // we now concat subjectNeighbours and objectNeighbours together
      let keyColNeighbours = processedSubjectNeighbours.concat(processedObjectNeighbours);

      let optionsMap = this.state.optionsMap.slice();
      for (let i = 0; i < optionsMap.length; ++i) {
        if (i !== colIndex) {
          optionsMap[i] = keyColNeighbours;
        }
      }

      document.body.classList.remove('waiting');

      // Support for undo: 
      let lastAction = "contextSetColumn";
      let prevState = 
          {
            "keyColIndex": this.state.keyColIndex,
            "keyColNeighbours": this.state.keyColNeighbours,
            "firstDegNeighbours": this.state.firstDegNeighbours,
            "curActionInfo": this.state.curActionInfo,
            "optionsMap": this.state.optionsMap,
            "tabIndex": this.state.tabIndex,
          };

      this.setState({
        keyColIndex: colIndex,
        keyColNeighbours: keyColNeighbours,
        firstDegNeighbours: firstDegNeighbours,
        curActionInfo: {"task":"afterPopulateColumn"},
        optionsMap: optionsMap,
        tabIndex: 0, // we want to set the currently active tab to be wrangling actions
        lastAction: lastAction,
        prevState: prevState,
      });
    })
    })
  }

  // The following function displays the origin of a cell in the Action Panel.

  contextCellOrigin(e, rowIndex, colIndex) {
    // To get the origin of a cell, we simply returns its "origin field"
    // The trick is to set the origin field correctly in previous functions
    // The place to do that should be in the two populating columns

    let cellSelected = this.state.tableData[rowIndex][colIndex];

    let originElement = [];
    for (let i = 0; i < cellSelected.origin.length; ++i) {
      if (i === 0) {
        originElement.push(<p>{cellSelected.origin[i]}</p>);
      } else {
        originElement.push(<p>{cellSelected.origin[i]}</p>);
      }
    }

    // This origin literal correctly contains the cell Origin we want to display
    // Now we just need to show it in the ActionPanel
    let tempObj = {};
    tempObj["task"] = "contextCellOrigin";
    tempObj["origin"] = originElement;

    // Support for undo: 
    let lastAction = "contextCellOrigin";
    let prevState = 
        {
          "curActionInfo": this.state.curActionInfo,
          "tabIndex": this.state.tabIndex,
        };
    
    this.setState({
      curActionInfo: tempObj,
      tabIndex: 0, // we want to set the currently active tab to be wrangling actions
      lastAction: lastAction,
      prevState: prevState,
    });
  }

  // The following function displays the preview of a cell in the Action Panel.
  // Note: currently it will not have any N/A's

  contextCellPreview(e, rowIndex, colIndex) {
    document.body.classList.add('waiting');
    // console.log("Row index is "+rowIndex);
    // console.log("Col index is "+colIndex);

    // Let's first run queries to fetch the dbp neighbours and dbo neighbours for the selected cell (withe some filtering)
    // In here, we need both the ?p and ?o. This is different from before.

    let promiseArray = [];

    // Below is the first query we will make. In here we are using the tableCell as SUBJECT

    // select ?p ?value
    // where {
    // dbr:Barack_Obama ?p ?value.
    // }

    let prefixURLOne = 
      "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    let suffixURLOne = 
      "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    let queryBodyOne = 
      "select+%3Fp+%3Fvalue%0D%0Awhere+%7B%0D%0Adbr%3A" + 
      regexReplace(this.state.tableData[rowIndex][colIndex].data) +
      "+%3Fp+%3Fvalue.%0D%0A%7D&";
    let queryURLOne = prefixURLOne + queryBodyOne + suffixURLOne;
    let otherColPromiseSubject = fetchJSON(queryURLOne);
    promiseArray.push(otherColPromiseSubject);

    // Below is the second query we will make. In here we are using the tableCell as OBJECT.

    // select ?p ?value
    // where {
    // ?value ?p dbr:Barack_Obama.
    // }

    let prefixURLTwo = 
      "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    let suffixURLTwo = 
      "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    let queryBodyTwo =
      "select+%3Fp+%3Fvalue%0D%0Awhere+%7B%0D%0A%3Fvalue+%3Fp+dbr%3A" +
      regexReplace(this.state.tableData[rowIndex][colIndex].data) +
      ".%0D%0A%7D&";
    let queryURLTwo = prefixURLTwo + queryBodyTwo + suffixURLTwo;
    let otherColPromiseObject = fetchJSON(queryURLTwo);
    promiseArray.push(otherColPromiseObject);

    allPromiseReady(promiseArray).then((values) => {
      // console.log(values[0]);
      // console.log(values[1]);
      // let previewInfoArray = [];
      let subjectInfoArray = 
        updatePreviewInfo(
          values[0].results.bindings,
          "subject"
        );
      let objectInfoArray = 
        updatePreviewInfo(
          values[1].results.bindings,
          "object"
        );
      // console.log(subjectInfoArray);
      // console.log(objectInfoArray);
      // Pick up from here tomorrow.
      let previewInfoArray = subjectInfoArray.concat(objectInfoArray);

      // previewInfoArray correctly contains the cell preview we want to display
      // Now we just need to show it in the ActionPanel
      let tempObj = {};
      tempObj["task"] = "contextCellPreview";
      tempObj["cellValue"] = this.state.tableData[rowIndex][colIndex].data;
      tempObj["preview"] = previewInfoArray;

      // Support for undo: 
      document.body.classList.remove('waiting');
      let lastAction = "contextCellPreview";
      let prevState = 
          {
            "curActionInfo": this.state.curActionInfo,
            "tabIndex": this.state.tabIndex,
          };
      
      this.setState({
        curActionInfo: tempObj,
        tabIndex: 0, // we want to set the currently active tab to be wrangling actions
        lastAction: lastAction,
        prevState: prevState,
      });
    });
  }

  // The following function sets the bottom page URL to the Wikipage of selected cell.

  contextOpenLink(e, rowIndex, colIndex) {
    let iframeURL = "https://en.wikipedia.org/wiki/" + this.state.tableData[rowIndex][colIndex].data;
    this.setState({
      pageHidden: false,
      iframeURL: iframeURL,
      // curActionInfo: {"task":"afterPopulateColumn"},
    });
  }

  toggleTable(e, index) {
    let tableOpenList = this.state.tableOpenList.slice();
    tableOpenList[index] = !tableOpenList[index];
    // When we toggle on one table, we want to close all other tables
    for (let i = 0; i < tableOpenList.length; ++i) {
      if (i !== index) {
        tableOpenList[i] = false;
      }
    }
    // We should change the Action Panel here, if we just toggled open a table
    if (tableOpenList[index] === true) {
      this.setState({
        tableOpenList: tableOpenList,
        curActionInfo: { task: "selectTableIndex", tableIndex: index },
      });
    } else {
      this.setState({
        tableOpenList: tableOpenList,
        curActionInfo: null,
      });
    }
  }

  // The following function is a helper function for handleStartTable.

  // It takes in 2 parameters:
  // 1) tableDataExplore
  // 2) selectedClassAnnotation

  // It returns a Promise of an object with 5 properties:
  // 1) keyColIndex
  // 2) tableHeader
  // 3) tableData
  // 4) keyColNeighbours
  // 5) optionsMap.

  // This object contains all the information we needed for the Excel-style table.

  getTableStates(tableDataExplore, selectedClassAnnotation) {
    // We need to take care of keyColIndex, tableHeader, tableData, optionsMap, and keyColNeighbours

    // tableDataExplore contains all the information we need to set the five states listed above
    // We just need to make use of the "data" and "origin" attributes. rowSpan and colSpan have no impact here.
    // Also, since we are not modifying tableDataExplore, we do not need to make a copy of it.

    // First, let's deal with keyColIndex. 
    // We will use the first column such that it's class annotation is not [] or ["Number"] or ["originURL"]
    // If no such column exists, we default it to the first column

    // console.log(selectedClassAnnotation);

    let keyColIndex = -1;
    for (let i=0;i<selectedClassAnnotation.length;++i) {
      if (selectedClassAnnotation[i].length > 0 
          && !(selectedClassAnnotation[i].length === 1 && selectedClassAnnotation[i][0] === "Number")
          && !(selectedClassAnnotation[i].length === 1 && selectedClassAnnotation[i][0] === "originURL")
        ) {
        keyColIndex = i+1; 
        break;
      }
    }
    if (keyColIndex === -1) {
      keyColIndex = 0;
    }
    // console.log("Key Column Index is: ");
    // console.log(keyColIndex);

    // Now, let's deal with tableHeader. Note: these tableHeaders only have value and label, no range or type
    let tableHeader = [];
    for (let j=0;j<tableDataExplore[0].length;++j) {
      tableHeader.push(
        [
          {"value":tableDataExplore[0][j].data
          ,"label":tableDataExplore[0][j].data}
        ]
      )
    }
    // console.log("Table header is: ");
    // console.log(tableHeader);

    // Now, let's deal with tableData. Wee need to handle both data and origin.
    let tableData = [];
    // console.log(tableDataExplore);
    // This starts the loop for rows
    for (let i=1;i<tableDataExplore.length;++i) {
      let tempRow = [];
      // This starts the loop for columns
      for (let j=0;j<tableDataExplore[i].length;++j) {
        // First set the data
        let data = tableDataExplore[i][j].data;
        // Then set the origin
        let origin = [];
        let originText = tableDataExplore[i][j].origin+": "+tableHeader[j][0].value+": "+tableDataExplore[i][j].data;
        origin.push(originText);
        tempRow.push({"data":data,"origin":origin});
      }
      tableData.push(tempRow);
    }
    // console.log("Table data is: ");
    // console.log(tableData);

    // Now, let's deal with keyColNeighbours and optionsMap
    // Note: the following part should be similar to what we have in contextSetColumn

    let promiseArrayOne = this.getNeighbourPromise(tableData, "subject", keyColIndex);
    let promiseArrayTwo = this.getNeighbourPromise(tableData, "object", keyColIndex);
    return allPromiseReady(promiseArrayOne).then((valuesOne) => {
    return allPromiseReady(promiseArrayTwo).then((valuesTwo) => {
      // console.log(valuesOne);
      // console.log(valuesTwo);

      // To support the firstDegNeighbours prefetching, let's store the first degree neighbours in state firstDegNeighbours
      let firstDegNeighbours = {};

      // First we deal with subject neighbours, so valuesOne
      let subjectNeighbourArray = [];
      for (let i = 0; i < valuesOne.length; ++i) {
        let temp = updateKeyColNeighbours(
          [],
          valuesOne[i].results.bindings,
          "subject"
        )
        subjectNeighbourArray.push(temp);
      }
      firstDegNeighbours["subject"] = storeFirstDeg(subjectNeighbourArray);
      let processedSubjectNeighbours = processAllNeighbours(subjectNeighbourArray);
      processedSubjectNeighbours = addRecommendNeighbours(processedSubjectNeighbours);
      // Need modification here

      // Then we deal with object neighbours, so valuesTwo
      let objectNeighbourArray = [];
      for (let i = 0; i < valuesTwo.length; ++i) {
        let temp = updateKeyColNeighbours(
          [],
          valuesTwo[i].results.bindings,
          "object"
        )
        objectNeighbourArray.push(temp);
      }
      firstDegNeighbours["object"] = storeFirstDeg(objectNeighbourArray);
      let processedObjectNeighbours = processAllNeighbours(objectNeighbourArray);
      processedObjectNeighbours = addRecommendNeighbours(processedObjectNeighbours);
      // Need modification here

      // console.log(processedSubjectNeighbours);
      // console.log(processedObjectNeighbours);

      // we now concat subjectNeighbours and objectNeighbours together
      let keyColNeighbours = processedSubjectNeighbours.concat(processedObjectNeighbours);

      // console.log(keyColNeighbours);

      // Now, we handle the optionsMaps
      // We can just put on empty options.
      let optionsMap = [];
      for (let j=0;j<tableHeader.length;++j) {
        optionsMap.push([]);
      }
      // console.log("Options Map are: ");
      // console.log(optionsMap);
      
      // Lastly, let's put all the information together in a single object, and return it as a Promise
      return Promise.resolve(
        {
          "keyColIndex":keyColIndex,
          "tableHeader":tableHeader,
          "tableData":tableData,
          "keyColNeighbours":keyColNeighbours,
          "firstDegNeighbours":firstDegNeighbours,
          "optionsMap":optionsMap
        }
      )
    })
    })
  }

  // The following function handles the selection of table.

  handleStartTable(e, tableIndex) {
    document.body.classList.add('waiting');
    
    // We need to let table panel display the selected table
    // And we need to update the Action Panel to display the first degree properties of the origigitnal page
    // We do a fetch request here (Sixth Query). It gets the property neighbours of the original page that are links, as well as dct:subject
    // Lastly, we need to set usecaseSelected to "startSubject"

    // First query gets the property neighbours
    let queryPromise = [];
    let prefixURLOne =
      "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    let suffixURLOne =
      "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    let queryBodyOne =
      "SELECT+%3Fp+%3Fo%0D%0AWHERE+%7B%0D%0A++++++dbr%3A" +
      urlReplace(this.state.urlPasted.slice(30)) +
      "+%3Fp+%3Fo.%0D%0A++++++BIND%28STR%28%3Fp%29+AS+%3FpString+%29.%0D%0A++++++FILTER%28isIRI%28%3Fo%29+%26%26+regex%28%3FpString%2C%22property%22%2C%22i%22%29+%26%26+%28%21regex%28%3FpString%2C%22text%22%2C%22i%22%29%29%29.%0D%0A%7D%0D%0A&";
    let queryURLOne = prefixURLOne + queryBodyOne + suffixURLOne;
    let queryOne = fetchJSON(queryURLOne);
    queryPromise.push(queryOne);

    // Second query gets the dct:subject neighbours
    let prefixURLTwo =
      "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    let suffixURLTwo =
      "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    let queryBodyTwo =
      "SELECT+%3Fo%0D%0AWHERE+%7B%0D%0A++++++dbr%3A" +
      urlReplace(this.state.urlPasted.slice(30)) +
      "+dct%3Asubject+%3Fo%0D%0A%7D&";
    let queryURLTwo = prefixURLTwo + queryBodyTwo + suffixURLTwo;
    // console.log(queryURLTwo);
    let queryTwo = fetchJSON(queryURLTwo);
    queryPromise.push(queryTwo);

    // Third query here should get the class annotations
    queryPromise.push(
      findClassAnnotation(this.state.originTableArray[tableIndex])
    );

    // now we process the query results
    allPromiseReady(queryPromise).then((queryResults) => {
      // console.log(queryResults[0].results.bindings);
      // console.log(queryResults[1].results.bindings);
      // console.log(queryResults[2]);
      let selectedClassAnnotation = queryResults[2];
      console.log(selectedClassAnnotation);

      // First we fetch the property neighbours
      // Let's also do some prefetching at this stage: let's remove the propertyNeighbours with too many siblings (150)
      // and remove the propertyNeighbours with only one child (aka the originally pasted page)

      let propertyNeighboursPO = [];
      let promiseArray = [];
      let bindingArray = [];

      // The part below deals with the property neighbours
      bindingArray = queryResults[0].results.bindings;
      for (let i = 0; i < bindingArray.length; ++i) {
        let predicate = bindingArray[i].p.value.slice(28);
        // console.log("Predicate is "+predicate);
        let object = bindingArray[i].o.value.slice(28);
        // console.log("Object is "+object);
        // If object includes some weird literal values, we replace it with "NONEXISTING"
        if (object.includes("/")) {
          object = "NONEXISTING";
        }
        let prefixURL =
          "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
        let suffixURL =
          "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
        let queryBody =
          "SELECT+%3Fs+%0D%0AWHERE+%7B%0D%0A%09%3Fs+dbp%3A" +
          regexReplace(predicate) +
          "+dbr%3A" +
          regexReplace(object) +
          "%0D%0A%7D%0D%0A&";
        let queryURL = prefixURL + queryBody + suffixURL;
        let curPromise = fetchJSON(queryURL);
        propertyNeighboursPO.push({ predicate: predicate, object: object });
        promiseArray.push(curPromise);
      }

      // The part below deals with the dct:subject neighbours
      bindingArray = queryResults[1].results.bindings;
      for (let i = 0; i < bindingArray.length; ++i) {
        let object = bindingArray[i].o.value.slice(37);
        let prefixURL =
          "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
        let suffixURL =
          "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
        let queryBody =
          "SELECT+%3Fs%0D%0AWHERE+%7B%0D%0A++++++%3Fs+dct%3Asubject+dbc%3A" +
          regexReplace(object) +
          "%0D%0A%7D&";
        let queryURL = prefixURL + queryBody + suffixURL;
        let curPromise = fetchJSON(queryURL);
        propertyNeighboursPO.push({ predicate: "subject", object: object });
        promiseArray.push(curPromise);
      }

      // The part below processes all the siblings and remove neighbours with too many or too few siblings

      allPromiseReady(promiseArray).then((values) => {
        let propertyNeighbours = [];
        let urlOrigin = decodeURIComponent(this.state.urlPasted.slice(30));
        // console.log(urlOrigin);
        for (let i = 0; i < values.length; ++i) {
          let curSiblingArray = values[i].results.bindings;
          // Note, this 150 below should also be adjustable by users
          if (curSiblingArray.length > 1 && curSiblingArray.length < 150) {
            let siblingArray = [];
            for (let i = 0; i < curSiblingArray.length; ++i) {
              let siblingName = curSiblingArray[i].s.value.slice(28);
              siblingArray.push({
                isOpen: false,
                name: siblingName,
                tableArray: [],
              });
            }
            // console.log(siblingArray);
            propertyNeighbours.push({
              predicate: propertyNeighboursPO[i].predicate,
              object: propertyNeighboursPO[i].object,
              isOpen: false,
              siblingArray: siblingArray,
            });
          }
        }
        // we do a rudimentary ranking here: sort the property neighbours by the length of siblingArray
        propertyNeighbours.sort((a, b) =>
          a.siblingArray.length < b.siblingArray.length ? 1 : -1
        );
        // Then we update the action in Action Panel
        let curActionInfo = { task: "showPropertyNeighbours" };
        // Then we call the parse table helper function to update the tableDataExplore
        let selectedTableHTML = this.state.originTableArray[tableIndex];
        // setTableFromHTML is the function that prepares the data for tableDataExplore
        let tableDataExplore = setTableFromHTML(selectedTableHTML, urlOrigin);

        // Modeless Change: We need to call the helper function this.getTableStates.
        // By processing the tableDataExplore to get the right states for the Excel-style table.

        // To do this, we need to call this.getTableStates here. We just need to pass in tableDataExplore and selectedClassAnnotation 
        let statePromise = [this.getTableStates(tableDataExplore, selectedClassAnnotation)];
        allPromiseReady(statePromise).then((values) => {
          let stateInfo = values[0];
          // console.log(stateInfo);

          document.body.classList.remove('waiting');
          // Support for undo: 
          let lastAction = "handleStartTable";
          let prevState = 
              {
                "selectedTableIndex": this.state.selectedTableIndex,
                "propertyNeighbours": this.state.propertyNeighbours,
                "curActionInfo": this.state.curActionInfo,
                "selectedClassAnnotation": this.state.selectedClassAnnotation,
                "keyColIndex": this.state.keyColIndex,
                "keyColNeighbours": this.state.keyColNeighbours,
                "firstDegNeighbours": this.state.firstDegNeighbours,
                "tableData": this.state.tableData,
                "tableHeader": this.state.tableHeader,
                "optionsMap": this.state.optionsMap,
                "usecaseSelected": this.state.usecaseSelected,
                "tabIndex": this.state.tabIndex,
              };

          this.setState({
            selectedTableIndex: tableIndex,
            propertyNeighbours: propertyNeighbours,
            curActionInfo: curActionInfo,
            selectedClassAnnotation: selectedClassAnnotation,
            keyColIndex: stateInfo.keyColIndex,
            keyColNeighbours: stateInfo.keyColNeighbours,
            firstDegNeighbours: stateInfo.firstDegNeighbours,
            tableData: stateInfo.tableData,
            tableHeader: stateInfo.tableHeader,
            optionsMap: stateInfo.optionsMap,
            usecaseSelected: "startTable",
            tabIndex: 1,
            lastAction: lastAction,
            prevState: prevState,
          });
          // this.handleTabSwitch(1);
        })
      });
    });
  }

  togglePropertyNeighbours(e, index) {
    document.body.classList.add('waiting');
    
    // First let's do the toggling task
    let propertyNeighbours = this.state.propertyNeighbours.slice();
    propertyNeighbours[index].isOpen = !propertyNeighbours[index].isOpen;

    // we want to loop through all siblings if we are toggling a propertyNeighbour on
    if (propertyNeighbours[index].isOpen === true) {
      let bindingArray = propertyNeighbours[index].siblingArray;
      let siblingArray = [];
      let siblingNameArray = []; // this array keeps track of the sibling names
      let promiseArray = [];
      for (let i = 0; i < bindingArray.length; ++i) {
        let siblingName = bindingArray[i].name;
        let siblingURL = "https://en.wikipedia.org/wiki/" + siblingName;
        let curPromise = fetchText(siblingURL);
        promiseArray.push(curPromise);
        siblingNameArray.push(siblingName);
      }

      // Since we only want to display siblings with useful tables, we do some checking here
      allPromiseReady(promiseArray).then((values) => {
        // tableArrayPromise stores an array of promises that resolve to tableArray
        let tableArrayPromise = [];
        for (let i = 0; i < values.length; ++i) {
          let pageHTML = values[i];
          // This is a helper function that fetches useful tables from pageHTML
          // console.log("The class annotation for the selected table is: ");
          // console.log(this.state.selectedClassAnnotation);
          tableArrayPromise.push(
            findTableFromHTML(
              this.state.tableHeader,
              pageHTML,
              this.state.selectedClassAnnotation,
              this.state.semanticEnabled,
              this.state.unionCutOff,
              siblingNameArray[i]
            )
          );
          // we potentially want to do something different here if urlOrigin === siblingNameArray[i]
          // We only want to keep siblings that do have useful tables
          // if (tableArray.length !== 0) {
          // siblingArray.push({"isOpen":false,"name":siblingNameArray[i],"tableArray":tableArray});
          // }
        }
        allPromiseReady(tableArrayPromise).then((tableArrayValues) => {
          for (let i = 0; i < tableArrayValues.length; ++i) {
            siblingArray.push({
              isOpen: false,
              name: siblingNameArray[i],
              tableArray: tableArrayValues[i],
            });
          }
          // This following line sorts the siblingArray
          siblingArray.sort(function (a, b) {
            let aTableLength = a.tableArray.length;
            let bTableLength = b.tableArray.length;
            let aName = a.name;
            let bName = b.name;
            if (aTableLength === bTableLength) {
              return aName < bName ? -1 : aName > bName ? 1 : 0;
            } else {
              return aTableLength > bTableLength ? -1 : 1;
            }
          });
          propertyNeighbours[index].siblingArray = siblingArray;
          document.body.classList.remove('waiting');
          this.setState({
            propertyNeighbours: propertyNeighbours,
          });
        });
      });
    } else {
      document.body.classList.remove('waiting');
      this.setState({
        propertyNeighbours: propertyNeighbours,
      });
    }
  }

  // The following function handles the toggling of a sibling URL

  toggleSibling(e, firstIndex, secondIndex) {
    // Handle the toggling task
    // console.log("Here we start the sibling toggle");
    // console.log("The current property neighbour is ");
    // console.log(
    //   "The current property neighbour is ",
    //   this.state.propertyNeighbours.slice()
    // );
    let propertyNeighbours = this.state.propertyNeighbours.slice();
    // console.log(propertyNeighbours);
    let selectedSibling =
      propertyNeighbours[firstIndex].siblingArray[secondIndex];

    // Note that if this sibling's tableArray is empty, we probably do not want to toggle it.
    if (selectedSibling.tableArray.length === 0) {
      // console.log("Selected sibling has no tables: " + selectedSibling.name);
      let iframeURL = "https://en.wikipedia.org/wiki/" + selectedSibling.name;
      this.setState({
        pageHidden: false,
        iframeURL: iframeURL,
      });
    } else {
      // if the sibling's tableArray is not empty, we want to toggle it
      selectedSibling.isOpen = !selectedSibling.isOpen;
      // console.log("Let's take a look at the current property neighbour");
      // console.log(propertyNeighbours[firstIndex]);
      // if (propertyNeighbours[firstIndex].isOpen === false) {
      // propertyNeighbours[firstIndex].isOpen = true;
      // console.log("In here we should have fixed the problem.");
      // console.log(propertyNeighbours);
      // }
      // We also want to change the iframe displayed at the bottom if we are toggling a sibling open
      if (selectedSibling.isOpen === true) {
        // console.log("If we get here, then sibling page should be opened");
        let iframeURL = "https://en.wikipedia.org/wiki/" + selectedSibling.name;
        // console.log(propertyNeighbours[firstIndex].isOpen);
        propertyNeighbours[firstIndex].isOpen = true;
        // console.log(propertyNeighbours[firstIndex]);
        // console.log(propertyNeighbours[firstIndex].isOpen);
        // console.log("First index is: " + firstIndex);
        // console.log("In here we should have fixed the problem.");
        // console.log("This is the property neighbour we will pass in");
        // console.log(propertyNeighbours);
        this.setState({
          propertyNeighbours: propertyNeighbours,
          iframeURL: iframeURL,
        });
      } else {
        this.setState({
          propertyNeighbours: propertyNeighbours,
        });
      }
    }
  }

  // The following function handles the toggling of other table (that's the same as the selected table)

  toggleOtherTable(e, firstIndex, secondIndex, thirdIndex) {
    // First handle the toggling task
    let propertyNeighbours = this.state.propertyNeighbours.slice();
    const selectedTable =
      propertyNeighbours[firstIndex].siblingArray[secondIndex].tableArray[
        thirdIndex
      ];
    // console.log(selectedTable.data);
    selectedTable.isOpen = !selectedTable.isOpen;
    this.setState({
      propertyNeighbours: propertyNeighbours,
    });
  }

  // The following funcion unions the table that user has selected to the table in the TablePanel
  // by changing tableDataExplore

  unionTable(firstIndex, secondIndex, otherTableHTML, colMapping) {
    // First we create a copy of the current tableData
    let tableData = _.cloneDeep(this.state.tableData);
    // console.log(tableData);

    // Then we get the clean data and set the origin for the other table.
    // We do so by calling setTableFromHTML, and setUnionData.
    let otherTableOrigin = this.state.propertyNeighbours[firstIndex]
      .siblingArray[secondIndex].name;
    let otherTableData = setTableFromHTML(otherTableHTML, otherTableOrigin);
    otherTableData = setUnionData(otherTableData);
    // console.log(otherTableData);

    // console.log(colMapping);

    // Note: we have to create a copy of colMapping, otherwise we are modifying the reference
    let tempMapping = colMapping.slice();
    tableData = tableConcat(
      tableData,
      otherTableData,
      tempMapping
    );

    // console.log(tableData);

    // Support for undo: 
    let lastAction = "unionTable";
    let prevState = 
        {
          "tableData":this.state.tableData,
        };

    this.setState({
      tableData: tableData,
      lastAction: lastAction,
      prevState: prevState,
    });
  }

  // The following function unions all similar tables found under a sibling page with the selected table
  unionPage(firstIndex, secondIndex) {
    // First we create a copy of the current tableDataExplore
    let tableData = _.cloneDeep(this.state.tableData);
    // We get the tableArray and name of the current sibling page
    let tableArray = 
      this.state.propertyNeighbours[firstIndex].siblingArray[secondIndex].tableArray;
    let otherTableOrigin = 
      this.state.propertyNeighbours[firstIndex].siblingArray[secondIndex].name;

    for (let i = 0; i < tableArray.length; ++i) {
      // We get the clean data for the current "other table"
      let otherTableData = setTableFromHTML(
        tableArray[i].data,
        otherTableOrigin
      );
      // We fetch the header row now
      let headerRow = otherTableData[0];
      otherTableData = setUnionData(otherTableData);
      // console.log(headerRow);
      // console.log(this.state.tableHeader);

      // Let's do some checking here: we do not want to union the same table with itself
      let sameTable = false;
      if (otherTableOrigin === decodeURIComponent(this.state.urlPasted.slice(30)) && headerRow.length === tableData[0].length) {
        let diffColFound = false;
        for (let m=0; m<headerRow.length; ++m) {
          if (headerRow[m].data !== this.state.tableHeader[m].value) {
            diffColFound = true;
            break;
          }
        }
        if (diffColFound === false) {
          sameTable = true;
        }
      }
      // We create a copy of the colMapping of the current "other table"
      let tempMapping = tableArray[i].colMapping.slice();

      // if sameTable is false, we can safely union the data
      if (sameTable === false) {
        tableData = tableConcat(
          tableData,
          otherTableData,
          tempMapping
        );
      }
    }
    // Support for undo: 
    let lastAction = "unionPage";
    let prevState = 
        {
          "tableData":this.state.tableData,
        };

    this.setState({
      tableData: tableData,
      lastAction: lastAction,
      prevState: prevState,
    });
  }

  // The following function unions all similar tables found under a property(parent) neighbour with the selected table
  // This is the highest level of union.

  unionProperty(firstIndex) {
    // First we create a copy of the current tableDataExplore
    let tableData = _.cloneDeep(this.state.tableData);

    // we get the siblingArray of the current property neighbour
    let siblingArray = this.state.propertyNeighbours[firstIndex].siblingArray;

    for (let i = 0; i < siblingArray.length; ++i) {
      // We get the tableArray and name of the current sibling page
      let tableArray = siblingArray[i].tableArray;
      let otherTableOrigin = siblingArray[i].name;
      // console.log(otherTableOrigin);
      // If the current sibling has no tables that are unionable, we break out of the loop.
      // Because siblingArray is sorted by the length of their tableArray
      if (tableArray.length === 0) {
        break;
      }
      // Else, we want to union all unionable tables from the current sibling page
      else {
        for (let j = 0; j < tableArray.length; ++j) {
          // We get the clean data for the current "other table"
          let otherTableData = setTableFromHTML(
            tableArray[j].data,
            otherTableOrigin
          );
          // We fetch the column header row
          let headerRow = otherTableData[0];
          otherTableData = setUnionData(otherTableData);
          // Let's do some checking here: we do not want to union the same table with itself
          let sameTable = false;
          if (otherTableOrigin === decodeURIComponent(this.state.urlPasted.slice(30)) && headerRow.length === tableData[0].length) {
            let diffColFound = false;
            for (let m=0; m<headerRow.length; ++m) {
              if (headerRow[m].data !== this.state.tableHeader[m].value) {
                diffColFound = true;
                break;
              }
            }
            if (diffColFound === false) {
              sameTable = true;
            }
          }
          // We create a copy of the colMapping of the current "oother table"
          let tempMapping = tableArray[j].colMapping.slice();

          // if sameTable is false, we can safely union the data
          if (sameTable === false) {
            tableData = tableConcat(
              tableData,
              otherTableData,
              tempMapping
            );
          }
        }
      }
    }

    // Support for undo: 
    let lastAction = "unionProperty";
    let prevState = 
        {
          "tableData":this.state.tableData,
        };

    this.setState({
      tableData: tableData,
      lastAction: lastAction,
      prevState: prevState,
    });
  }

  // This function handles the change of "semanticEnabled" setting

  toggleSemantic(e) {
    // we want to toggle off all the property neighbours in the action panel
    // because changing semanticEnabled changes our search criteria
    let propertyNeighbours = this.state.propertyNeighbours.slice();
    for (let i = 0; i < propertyNeighbours.length; ++i) {
      propertyNeighbours[i].isOpen = false;
    }

    this.setState({
      semanticEnabled: e.target.value,
      propertyNeighbours: propertyNeighbours,
    });
  }

  // This function handles the change of the unionCutoff percentage

  unionCutOffChange(e) {
    // we want to toggle off all the property neighbours in the action panel
    // because changing union cutoff changes our search criteria
    let propertyNeighbours = this.state.propertyNeighbours.slice();
    for (let i = 0; i < propertyNeighbours.length; ++i) {
      propertyNeighbours[i].isOpen = false;
    }
    this.setState({
      unionCutOff: e.target.value,
      propertyNeighbours: propertyNeighbours,
    });
  }

  // This function handles opening the filter for a particular column

  openFilter(e, colIndex) {
    // In this function, we want to set showFilter to true, and update dataAndChecked based on colIndex

    let dataArray = [];
    for (let i = 0; i < this.state.tableData.length; ++i) {
      dataArray.push(this.state.tableData[i][colIndex].data);
    }
    dataArray = [...new Set(dataArray)];
    // Let's sort this dataArray a bit: we put N/A at the beginning of the array
    dataArray.sort(
      function(a,b) { 
        return a === "N/A" ? -1 : b === "N/A" ? 1 : 0; 
      }
    );

    let dataAndChecked = [];
    for (let i=0;i<dataArray.length;++i) {
      dataAndChecked.push(
        {
          "data":dataArray[i],
          "checked":true
        }
      )
    }
    // console.log(dataAndChecked);

    this.setState({
      dataAndChecked: dataAndChecked,
      showFilter: true,
      curFilterIndex: colIndex,
    })
  }

  // This function handles cancelling the filter (so we close it).

  cancelFilter(e) {
    this.setState({
      dataAndChecked: [],
      showFilter: false,
      curFilterIndex: -1,
    })
  }

  // This function handles toggling the data checkboxes in filter modal.

  toggleChecked(e, checkIndex) {
    let dataAndChecked = this.state.dataAndChecked;
    dataAndChecked[checkIndex].checked = !dataAndChecked[checkIndex].checked;
    this.setState({
      dataAndChecked:dataAndChecked,
    })
  }

  // This function handles applying the filter to tableData, based on dataAndChecked

  applyFilter(e) {
    // console.log(this.state.dataAndChecked);
    // console.log(this.state.curFilterIndex);

    let valuesToKeep = [];
    for (let i=0;i<this.state.dataAndChecked.length;++i) {
      if (this.state.dataAndChecked[i].checked === true) {
        valuesToKeep.push(this.state.dataAndChecked[i].data);
      }
    }
    let tableData = _.cloneDeep(this.state.tableData);
    for (let i=0;i<tableData.length;++i) {
      if (!valuesToKeep.includes(tableData[i][this.state.curFilterIndex].data)) {
        tableData.splice(i,1);
        --i;
      }
    }
    // console.log(tableData);

    // Before we use tableData to update this.state.tableData, we need to add suppport for undo.
    let lastAction = "applyFilter";
    let prevState = 
        {
          "tableData":this.state.tableData,
          "curActionInfo":this.state.curActionInfo,
        };
    
    this.setState({
      dataAndChecked: [],
      showFilter: false,
      curFilterIndex: -1,
      tableData: tableData,
      lastAction: lastAction,
      prevState: prevState,
    })
  }

  // This function hanles switching tabs

  handleTabSwitch(index) {
    // If we are switching to "Union Table" tab from "Wrangling Actions" tab, we want to toggle off all the property neighbours.
    // Since we might have potentially changed the table in table panel, thus changed the search criteria as well
    if (index === 1) {
      let propertyNeighbours = this.state.propertyNeighbours.slice();
      for (let i = 0; i < propertyNeighbours.length; ++i) {
        propertyNeighbours[i].isOpen = false;
      }
      this.setState({
        propertyNeighbours: propertyNeighbours,
        tabIndex: index,
      });
    }
    else {
      this.setState({
        tabIndex: index,
      })
    }
  }

  // This function undos the previous change that user has made to the result table in table panel

  undoPreviousStep() {
    // We first get which action we need to undo
    let lastAction = this.state.lastAction;
    // Then we fetch the previous state
    let prevState = this.state.prevState;
    // console.log(lastAction);
    // console.log(prevState);

    // Note, since we are allowing one step undo only, we set lastAction to "" everytime we run this function

    // Case 1: Undo the ULR Paste. 
    // In this case we need to restore urlPasted, iframeURL, originTableArray, and tableOpenList
    if (lastAction === "handleURLPaste") {
      this.setState({
        urlPasted: prevState.urlPasted,
        iframeURL: prevState.iframeURL,
        originTableArray: prevState.originTableArray,
        tableOpenList: prevState.tableOpenList,
      })
    }

    // Case 2: Undo the selection of the task: startSubject.
    // In this case we need to restore usecaseSelected, and tableData

    else if (lastAction === "handleStartSubject") {
      this.setState({
        usecaseSelected: prevState.usecaseSelected,
        tableData: prevState.tableData,
        firstColSelection: prevState.firstColSelection,
        firstColChecked: prevState.firstColChecked,
        tabIndex: prevState.tabIndex,
        curActionInfo: prevState.curActionInfo,
        lastAction: "",
      })
    }

    // Case 3: Undo the selection of the task: startTable.
    // In this case we need to restore many states. See code below.

    else if (lastAction === "handleStartTable") {
      this.setState({
        selectedTableIndex: prevState.selectedTableIndex,
        propertyNeighbours: prevState.propertyNeighbours,
        curActionInfo: prevState.curActionInfo,
        selectedClassAnnotation: prevState.selectedClassAnnotation,
        keyColIndex: prevState.keyColIndex,
        keyColNeighbours: prevState.keyColNeighbours,
        firstDegNeighbours: prevState.firstDegNeighbours,
        tableData: prevState.tableData,
        tableHeader: prevState.tableHeader,
        optionsMap: prevState.optionsMap,
        usecaseSelected: prevState.usecaseSelected,
        tabIndex: prevState.tabIndex,
        lastAction: "",
      })
    }

    // Case 4: Undo the population of key column.
    // In this case we need to restore keyColIndex, keyColNeighbours, curActionInfo, tableData, optionsMap
    else if (lastAction === "populateKeyColumn") {
      this.setState({
        keyColIndex: prevState.keyColIndex,
        keyColNeighbours: prevState.keyColNeighbours,
        firstDegNeighbours: prevState.firstDegNeighbours,
        curActionInfo: prevState.curActionInfo,
        tableData: prevState.tableData,
        tableHeader: prevState.tableHeader,
        firstColFilled: prevState.firstColFilled,
        optionsMap: prevState.optionsMap,
        lastAction: "",
      })
    }

    // Case 5: Undo the population of a new column.
    // In this case we need to restore curActionInfo, tableData.
    else if (lastAction === "populateOtherColumn") {
      this.setState({
        curActionInfo: prevState.curActionInfo,
        tableData: prevState.tableData,
        lastAction: "",
      })
    }

    // Case 6: Undo the population of same neighbour in different columns.
    // In this case we need to restore curActionInfo, tableData, tableHeader, optionsMap.
    else if (lastAction === "sameNeighbourDiffCol") {
      this.setState({
        curActionInfo: prevState.curActionInfo,
        tableData: prevState.tableData,
        tableHeader: prevState.tableHeader,
        optionsMap: prevState.optionsMap,
        selectedClassAnnotation: prevState.selectedClassAnnotation,
        keyColIndex: prevState.keyColIndex,
        lastAction: "",
      })
    }

    // Case 7: Undo the population of same neighbour in the same column.
    // In this case we need to restore the curActionInfo, tableData.
    else if (lastAction === "sameNeighbourOneCol") {
      this.setState({
        curActionInfo: prevState.curActionInfo,
        tableData: prevState.tableData,
        lastAction: "",
      })
    }

    // Case 8: Undo the population of neighbours from the same range.
    // In this case we need to restore curActionInfo, tableData, tableHeader, optionsMap
    else if (lastAction === "populateSameRange") {
      this.setState({
        curActionInfo: prevState.curActionInfo,
        tableData: prevState.tableData,
        tableHeader: prevState.tableHeader,
        optionsMap: prevState.optionsMap,
        selectedClassAnnotation: prevState.selectedClassAnnotation,
        keyColIndex: prevState.keyColIndex,
        lastAction: "",
      })
    }

    // Case 9: Undo the union of tables.
    // In this case we need to restore tableData
    else if (lastAction === "unionTable" || lastAction === "unionPage" || lastAction === "unionProperty") {
      this.setState({
        tableData: prevState.tableData,
        lastAction: "",
      })
    }

    // Case 10: Undo the addition of a new column
    else if (lastAction === "contextAddColumn") {
      this.setState({
        tableData: prevState.tableData,
        tableHeader: prevState.tableHeader,
        curActionInfo: prevState.curActionInfo,
        optionsMap: prevState.optionsMap,
        keyColIndex: prevState.keyColIndex,
        selectedClassAnnotation: prevState.selectedClassAnnotation,
        tabIndex: prevState.tabIndex,
        lastAction: "",
      })
    }

    // Case 11: Undo the set of search cell.
    else if (lastAction === "contextSetColumn") {
      this.setState({
        keyEntryIndex: prevState.keyEntryIndex,
        keyColIndex: prevState.keyColIndex,
        keyColNeighbours: prevState.keyColNeighbours,
        firstDegNeighbours: prevState.firstDegNeighbours,
        curActionInfo: prevState.curActionInfo,
        optionsMap: prevState.optionsMap,
        tabIndex: prevState.tabIndex,
        lastAction: "",
      })
    }

    // Case 12: Undo the showing of cell origin.
    else if (lastAction === "contextCellOrigin") {
      this.setState({
        curActionInfo: prevState.curActionInfo,
        tabIndex: prevState.tabIndex,
        lastAction: "",
      })
    }

    // Case 12: Undo the showing of cell preview.
    else if (lastAction === "contextCellPreview") {
      this.setState({
        curActionInfo: prevState.curActionInfo,
        tabIndex: prevState.tabIndex,
        lastAction: "",
      })
    }

    // Case 13: Undo the deletion of column.
    else if (lastAction === "contextDeleteColumn") {
      this.setState({
        tableData: prevState.tableData,
        tableHeader: prevState.tableHeader,
        optionsMap: prevState.optionsMap,
        selectedClassAnnotation: prevState.selectedClassAnnotation,
        keyColIndex: prevState.keyColIndex,
        propertyNeighbours: prevState.propertyNeighbours,
        curActionInfo: prevState.curActionInfo,
        lastAction: "",
      })
    }

    // Case 14: Undo the sorting of a column.
    else if (lastAction === "contextSortColumn") {
      this.setState({
        tableData: prevState.tableData,
        keyEntryIndex: prevState.keyEntryIndex,
        curActionInfo: prevState.curActionInfo,
        lastAction: "",
      })
    }

    // Case 15: Undo the row filtering based on column filters.
    else if (lastAction === "applyFilter") {
      this.setState({
        tableData: prevState.tableData,
        curActionInfo: prevState.curActionInfo,
        lastAction: "",
      })
    }

    // Case 16: Undo the joining of two tables.
    else if (lastAction === "runJoin") {
      this.setState({
        curActionInfo: prevState.curActionInfo,
        tableData: prevState.tableData,
        tableHeader: prevState.tableHeader,
        optionsMap: prevState.optionsMap,
        selectedClassAnnotation: prevState.selectedClassAnnotation,
        lastAction: "",
      })
    }

    // This is an empty else clause.
    else {

    }
  }

  // The two following functions opens/closes the modal for union table settings.

  openModal() {
    this.setState({
      showSetting: true,
    })
  }

  closeModal() {
    this.setState({
      showSetting: false,
    })
  }

  // The following function toggles this.state.showTableSelection.

  toggleTableSelection() {
    let showTableSelection = !this.state.showTableSelection;
    this.setState({
      showTableSelection: showTableSelection,
    })
  }

  // The following function handles the toggling of "show unionable tables" and "show joinable tables".
  // based on whether the string passed in is "union" or "join"

  toggleUnionJoin(e, str) {
    // In this case we are toggling on/off unionable tables 
    if (str === "union") {
      this.setState({
        showUnionTables: !this.state.showUnionTables,
        showJoinTables: false,
      })
    }
    // In this case we are toggling on/off joinable tables 
    else {
      // Note: every time before we toggle on joinable tables, let's set all this.state.tableOpenList to false
      let tableOpenList = this.state.tableOpenList.slice();
      for (let i = 0; i < tableOpenList.length; ++i) {
        tableOpenList[i] = false;
      }
      this.setState({
        showUnionTables: false,
        showJoinTables: !this.state.showJoinTables,
        tableOpenList: tableOpenList,
      })
    }
  }

  // The following function handles the join of a selected table with the table in tablePanel.

  handleJoinTable(e, i) {
    // We need to get two arrays of column headers. One for the table panel table, one for the selected table to join.
    let tableHeader = _.cloneDeep(this.state.tableHeader);
    let originTableHeader = [];
    let joinTableHeader = [];

    // Note: both originTableHeader and joinTableHeader are array of objects with three properties: label, value, and index

    // First we get the header for the origin table
    // Two cases: 1) first column is "OriginURL" (we started from a table) 2) otherwise, we have started from a subject

    // In this clause, we are in the "Start Table" case.
    if (tableHeader[0].value !== undefined) {
      for (let i = 0; i < tableHeader.length; ++i) {
        originTableHeader.push(tableHeader[i]);
        originTableHeader[i].index = i;
      }
    }
    // Else, we are in the "Start Subject" case.
    else {
      // console.log(tableHeader);
      // Let's loop through this tableHeader to fill the originTableHeader
      // We first push on the first element from tableHeader
      let value = "";
      for (let i = 0; i < tableHeader[0].length; ++i) {
        if (i > 0) {
          value+="&";
        }
        value+=tableHeader[0][i].value;
      }
      originTableHeader.push(
        {
          "value":value,
          "label":value,
          "index":0
        }
      )
      for (let i = 1; i < tableHeader.length; ++i) {
        if (tableHeader[i] === "") {
          break;
        }
        else {
          originTableHeader.push(
            {
              "value":tableHeader[i].value,
              "label":tableHeader[i].label,
              "index":i
            }
          )
        }
      }
    }
    // console.log(originTableHeader);

    // Now that we have originTableHeader working correctly, let's get the joinTableHeader
    let urlOrigin = decodeURIComponent(this.state.urlPasted.slice(30));
    let joinTableData = setTableFromHTML(this.state.originTableArray[i], urlOrigin);
    // console.log(joinTable);

    // We start the index from 1, because 0 index corresponds to OriginURL
    for (let i = 0; i < joinTableData[0].length; ++i) {
      joinTableHeader.push(
        {
          "value":joinTableData[0][i].data,
          "label":joinTableData[0][i].data,
          "index":i
        }
      )
    }

    // Now we take a look at originTableHeader, joinTableHeader, and joinTable
    // console.log(originTableHeader);
    // console.log(joinTableHeader);
    // console.log(joinTableData);

    // It seems like we have fetched the right values. 
    // Now we use these to update states, so that jon modal can display the right content.

    this.setState({
      showJoinModal: true,
      joinTableIndex: i,
      joinTableData: joinTableData,
      originColOptions: originTableHeader,
      joinColOptions: joinTableHeader,
    })
  }

  // The following function handles cancelling the join operation.

  cancelJoin(e) {
    this.setState({
      showJoinModal: false,
    })
  }

  // The following function handles the selection of join columns.
  // It updates either originJoinIndex, or joinJoinIndex, based on the second parameter passed in

  selectJoinColumn(e, table) {
    // console.log(e.index);
    if (table === "originTable") {
      this.setState({
        originJoinIndex: e.index,
      })
    }
    else {
      this.setState({
        joinJoinIndex: e.index,
      })
    }
  }

  // The function handles the actual join of two selected tables. 
  // Currently, the only join type supported is left join

  // Since join is equal to column addition, we need to update tableData, tableHeader, optionsMap, and selectedClassAnnotation
  runJoin(e) {
    // First check all the info that we needed
    let joinTableData = this.state.joinTableData.slice();
    let originJoinIndex = this.state.originJoinIndex;
    let joinJoinIndex = this.state.joinJoinIndex;
    // console.log(joinTableData);
    // console.log(originJoinIndex);
    // console.log(joinJoinIndex);
    
    // If the join table has n columns, then we are adding n-1 new columns to the table in table panel.
    // Since we only allow join of one column from each table.

    // Let's deal with tableHeader, optionsMap, and selectedCalssAnnotation, before we move on to tableData.
    let tableHeaderUpdated = this.state.tableHeader.slice();
    let optionsMapUpdated = this.state.optionsMap.slice();
    let selectedClassAnnotationUpdated = this.state.selectedClassAnnotation.slice();

    // First we handle tableHeader's addition.
    // We first loop through tableHeader to remove all the empty ones
    for (let i = 0; i < tableHeaderUpdated.length; ++i) {
      if (tableHeaderUpdated[i] === "") {
        tableHeaderUpdated.splice(i,1);
        --i;
      }
    }
    // Now we push on the new columns
    for (let i = 0; i < joinTableData[0].length; ++i) {
      if (i !== joinJoinIndex) {
        tableHeaderUpdated.push(
          {
            "value":joinTableData[0][i].data,
            "label":joinTableData[0][i].data
          }
        )
      }
    }
    // console.log(tableHeaderUpdated); 

    // Then we handle optionsMap's addition. We do not need to do much here.
    // We start the index from 1, because we only add in n-1 new columns.
    for (let i = 1; i < joinTableData[0].length; ++i) {
      optionsMapUpdated.push([]);
    }
    // console.log(optionsMapUpdated);

    // Then we handle selectedClassAnnotation's addition.
    let queryPromise = [findClassAnnotation(this.state.originTableArray[this.state.joinTableIndex])];
    allPromiseReady(queryPromise).then((values) => {
    // Note, we need to push on an empty [] to values here, corresponding to the originURL column's class annotation
    values[0].splice(0, 0, []);
    for (let i = 0; i < values[0].length; ++i) {
      if (i !== joinJoinIndex) {
        selectedClassAnnotationUpdated.push(values[0][i]);
      }
    }
    console.log(selectedClassAnnotationUpdated);
    
    // Lastly, and most importantly, we want to handle tableData's change.
    // Let's start with an empty tableDataUpdated. Loop through tableData. 
    // Use a bool to keep track of if tableData[i][originJoinIndex] is in join table. For every yes, we push one element onto tableDataUpdated.
    // If at the end, the bool is still no, we push on tableData[i] with a bunch of N/A's at the position of the newly added columns.
    let tableData = _.cloneDeep(this.state.tableData);
    let tableDataUpdated = [];
    // Let's first run some code to process joinTableData, so that it shares the same format as tableData
    // Now, let's deal with tableData. Wee need to handle both data and origin.
    let joinTableHeader = [];
    for (let j=0;j<joinTableData[0].length;++j) {
      joinTableHeader.push(
        {"value":joinTableData[0][j].data
        ,"label":joinTableData[0][j].data}
      )
    }
    let joinTableDataUpdated = [];
    // console.log(tableDataExplore);
    // This starts the loop for rows
    for (let i=1;i<joinTableData.length;++i) {
      let tempRow = [];
      // This starts the loop for columns
      for (let j=0;j<joinTableData[i].length;++j) {
        // First set the data
        let data = joinTableData[i][j].data;
        // Then set the origin
        let origin = [];
        let originText = joinTableData[i][j].origin+": "+joinTableHeader[j].value+": "+joinTableData[i][j].data;
        origin.push(originText);
        tempRow.push({"data":data,"origin":origin});
      }
      joinTableDataUpdated.push(tempRow);
    }

    // Take a look at tableData, and joinTableDataUpdated
    // console.log(tableData);
    // console.log(joinTableDataUpdated);

    // Now we can finally start the join operator
    for (let i = 0; i < tableData.length; ++i) {
      let curJoinEntry = tableData[i][originJoinIndex].data;
      console.log("Current entry to join is "+curJoinEntry);
      let curEntryFound = false;
      // We start the index from 1 because the first column in joinTableData is the header
      for (let j = 0; j < joinTableDataUpdated.length; ++j) {
        if (joinTableDataUpdated[j][joinJoinIndex].data === curJoinEntry) {
          // console.log("A match has been found at index "+j);
          // Let's create the tempRow that we want to push onto tableDataUpdated

          // Code Placeholder
          let tempRow = _.cloneDeep(tableData[i]);
          for (let k = 0; k < joinTableDataUpdated[j].length; ++k) {
            if (k !== joinJoinIndex) {
              tempRow.push(joinTableDataUpdated[j][k]);
            }
          }
          tableDataUpdated.push(tempRow);
          curEntryFound = true;
        }
      }
      // If this current entry does NOT have a corresponding entry in the join table,
      // We push it directly onto tableDataUpdated, with the addtion of some N/A's.
      if (curEntryFound === false) {
        // Let's create the tempRow that we want to push onto tableDataUpdated

        // Code Placeholder
        let tempRow = _.cloneDeep(tableData[i]);
        for (let k = 0; k < joinTableDataUpdated[0].length; ++k) {
          if (k !== joinJoinIndex) {
            tempRow.push(
              {
                "data":"N/A",
                "origin":[]
              }
            );
          }
        }
        tableDataUpdated.push(tempRow);
      }
    }
    // console.log(tableDataUpdated);

    // Now, we have correctly got everything we needed: tableDataUpdated, tableHeaderUpdated, optionsMapUpdated, selectedClassAnnotationUpdated
    // Let's add some support for undo, and do not forget to close the joinModal

    // Support for undo: 
    let lastAction = "runJoin";
    let prevState = 
      {
        "curActionInfo":this.state.curActionInfo,
        "tableData":this.state.tableData,
        "tableHeader":this.state.tableHeader,
        "optionsMap":this.state.optionsMap,
        "selectedClassAnnotation":this.state.selectedClassAnnotation,
      };

    this.setState({
      curActionInfo:{"task":"afterPopulateColumn"},
      tableData:tableDataUpdated,
      tableHeader:tableHeaderUpdated,
      optionsMap:optionsMapUpdated,
      selectedClassAnnotation:selectedClassAnnotationUpdated,
      showJoinModal: false,
      lastAction:lastAction,
      prevState:prevState,
    })
    })
  }

  render() {
    let bodyEle;
    let bottomContentClass = " bottom-content";
    let topContentClass = "row top-content";
    if (this.state.pageHidden) {
      bottomContentClass = " bottom-content-hidden";
      topContentClass = "row top-content-large";
    }
    // If user has not pasted the URL, we want to display the landing page
    if (this.state.urlPasted === "") {
      bodyEle = 
        <LandingPage 
          handleURLPaste={this.handleURLPaste} 
        />;
    }
    // Else, we show the three panels: TablePanel, ActionPanel, and PagePanel
    else {
      bodyEle = (
        <div>
          <div className="header">
            <Header 
              // Following states are passed for general purposes
              copyTable={this.copyTable}
              undoPreviousStep={this.undoPreviousStep}
              openModal = {this.openModal}
            />
          </div> 
          <div className="mainbody">
            <div className="">
              <div className={topContentClass}>
                <div className="col-md-7 small-padding table-panel">
                  <TablePanel
                    urlPasted={this.state.urlPasted}
                    usecaseSelected={this.state.usecaseSelected}
                    // Following states are passed to "startSubject"
                    tableHeader={this.state.tableHeader}
                    tableData={this.state.tableData}
                    keyColIndex={this.state.keyColIndex}
                    keyEntryIndex={this.state.keyEntryIndex}
                    onCellChange={this.cellChange}
                    selectColHeader={this.selectColHeader}
                    getKeyOptions={this.getKeyOptions}
                    getOtherOptions={this.getOtherOptions}
                    optionsMap={this.state.optionsMap}
                    contextAddColumn={this.contextAddColumn}
                    contextDeleteColumn={this.contextDeleteColumn}
                    contextSetColumn={this.contextSetColumn}
                    contextCellOrigin={this.contextCellOrigin}
                    contextCellPreview={this.contextCellPreview}
                    contextOpenLink={this.contextOpenLink}
                    contextSortColumn={this.contextSortColumn}
                    // Following states are useful for column filter
                    openFilter={this.openFilter}
                    // Following states control the conditional render of the table
                    firstColFilled={this.state.firstColFilled}
                  />
                </div>
                <div className="col-md-5 small-padding action-panel">
                  <ActionPanel
                    urlPasted={this.state.urlPasted}
                    usecaseSelected={this.state.usecaseSelected}
                    curActionInfo={this.state.curActionInfo}
                    handleStartSubject={this.handleStartSubject}
                    populateKeyColumn={this.populateKeyColumn}
                    populateOtherColumn={this.populateOtherColumn}
                    sameNeighbourDiffCol={this.sameNeighbourDiffCol}
                    sameNeighbourOneCol={this.sameNeighbourOneCol}
                    populateRecommendation={this.populateRecommendation}
                    // Folloiwng states are passed to "startTable"
                    handleStartTable={this.handleStartTable}
                    propertyNeighbours={this.state.propertyNeighbours}
                    togglePropertyNeighbours={this.togglePropertyNeighbours}
                    toggleSibling={this.toggleSibling}
                    toggleOtherTable={this.toggleOtherTable}
                    unionTable={this.unionTable}
                    unionPage={this.unionPage}
                    unionProperty={this.unionProperty}
                    // Follow state handles tab switch
                    tabIndex={this.state.tabIndex}
                    handleTabSwitch={this.handleTabSwitch}
                    // Following states are passed during start up
                    showTableSelection={this.state.showTableSelection}
                    toggleTableSelection={this.toggleTableSelection}
                    originTableArray={this.state.originTableArray}
                    tableOpenList={this.state.tableOpenList}
                    toggleTable={this.toggleTable}
                    selectedTableIndex={this.state.selectedTableIndex}
                    // Following states are for union/join tables
                    showUnionTables={this.state.showUnionTables}
                    showJoinTables={this.state.showJoinTables}
                    toggleUnionJoin={this.toggleUnionJoin}
                    handleJoinTable={this.handleJoinTable}
                    // Following states are for first column's header selection
                    firstColSelection={this.state.firstColSelection}
                    firstColChecked={this.state.firstColChecked}
                    toggleNeighbourSelection={this.toggleNeighbourSelection}
                    tableHeader={this.state.tableHeader}
                    latestCheckedIndex={this.state.latestCheckedIndex}
                  />
                </div>
              </div>
              <div className={bottomContentClass}>
                <div>
                  <PagePanel
                    pageHidden={this.state.pageHidden}
                    iframeURL={this.state.iframeURL}
                    toggleWikiPage={this.toggleWikiPage}
                  />
                </div>
              </div>
              <div>
                <SettingModal 
                  showSetting={this.state.showSetting}
                  closeModal={this.closeModal}
                  semanticEnabled={this.state.semanticEnabled}
                  toggleSemantic={this.toggleSemantic}
                  unionCutOff={this.state.unionCutOff}
                  unionCutOffChange={this.unionCutOffChange}
                />
              </div>
              <div>
                <FilterModal
                  showFilter={this.state.showFilter}
                  dataAndChecked={this.state.dataAndChecked}
                  applyFilter={this.applyFilter}
                  cancelFilter={this.cancelFilter}
                  toggleChecked={this.toggleChecked}
                />
              </div>
              <div>
                <JoinModal 
                  showJoin={this.state.showJoinModal}
                  cancelJoin={this.cancelJoin}
                  originColOptions={this.state.originColOptions}
                  joinColOptions={this.state.joinColOptions}
                  originJoinIndex={this.state.originJoinIndex}
                  joinJoinIndex={this.state.joinJoinIndex}
                  selectJoinColumn={this.selectJoinColumn}
                  runJoin={this.runJoin}
                />
              </div>
            </div>
          </div>
          <div className="footer">
            <Footer />
          </div> 
        </div>
      );
    }
    return <div>{bodyEle}</div>;
  }
}

export default MainBody;

// This function takes in a queryURL and returns its JSON format
function fetchJSON(url) {
  let urlCORS = "https://mysterious-ridge-15861.herokuapp.com/"+url;
  return fetch(urlCORS).then((response) => response.json());
}

// This function takes in a queryURL and returns its Text format
function fetchText(url) {
  let urlCORS = "https://mysterious-ridge-15861.herokuapp.com/"+url;
  return fetch(urlCORS).then((response) => response.text());
}

// This function ensures that all promises in promiseArray are ready
function allPromiseReady(promiseArray) {
  return Promise.all(promiseArray);
}

// This function replaces string so that the result can be used in queryURL.
// It currently replaces "(", ")", "'", "-", " ", "&", ".", """,and "/"
function regexReplace(str) {
  return str
    .replace(/\$/g, "%5Cu0024")
    .replace(/%/g, "%5Cu0025")
    .replace(/!/g, "%5Cu0021")
    .replace(/"/g, "%5Cu0022")
    .replace(/#/g, "%5Cu0023")
    .replace(/&/g, "%5Cu0026")
    .replace(/'/g, "%5Cu0027")
    .replace(/\(/g, "%5Cu0028")
    .replace(/\)/g, "%5Cu0029")
    .replace(/\*/g, "%5Cu002A")
    .replace(/\+/g, "%5Cu002B")
    .replace(/-/g, "%5Cu002D")
    .replace(/;/g, "%5Cu003B")
    .replace(/=/g, "%5Cu003D")
    .replace(/\?/g, "%5Cu003F")
    .replace(/\./g, "%5Cu002E")
    .replace(/\//g, "%5Cu002F")
    .replace(/,/g, "%5Cu002C")
    .replace(/\s/g, "_");
}

// This function replaces the URL pasted
function urlReplace(str) {
  return str
    .replace(/%E2%80%93/g, "%5Cu2013")
    .replace(/\$/g, "%5Cu0024")
    .replace(/!/g, "%5Cu0021")
    .replace(/"/g, "%5Cu0022")
    .replace(/#/g, "%5Cu0023")
    .replace(/&/g, "%5Cu0026")
    .replace(/'/g, "%5Cu0027")
    .replace(/\(/g, "%5Cu0028")
    .replace(/\)/g, "%5Cu0029")
    .replace(/\*/g, "%5Cu002A")
    .replace(/\+/g, "%5Cu002B")
    .replace(/-/g, "%5Cu002D")
    .replace(/;/g, "%5Cu003B")
    .replace(/=/g, "%5Cu003D")
    .replace(/\?/g, "%5Cu003F")
    .replace(/\./g, "%5Cu002E")
    .replace(/\//g, "%5Cu002F")
    .replace(/,/g, "%5Cu002C")
    .replace(/\s/g, "_");
}

// This function removes the prefix "http://dbpedia.org/resource/" from query results, if it includes one

function removePrefix(str) {
  let prefixToRemove = "http://dbpedia.org/resource/";
  // If dbResult contains prefix of "http://dbpedia.org/resource/", we want to remove it
  if (str.includes(prefixToRemove) === true) {
     str = str.slice(28);
  }
  return str;
}

// This function updates the key column's neighbours.

// It taks three parameters:
//  1) array "keyColNeighbour" storing list of neighbours for the key column
//  2) array "resultsBinding", storing the returned result of queryURL from Virtuoso
//  3) string "type", either "subject" or "object"

// It returns the updated keyColNeighbours
function updateKeyColNeighbours(keyColNeighbours, resultsBinding, type) {

  // we first filter out those in resultsBinding according to three criterias

  // 1) p.value.slice(28).length must > 1
  // 2) p.value must include "ontology" or "property" (so it is one of dbo:XXXX or dbp:XXXX)
  // 3) p.value must not include certain strings (which likely correspond to meaningless attributes)

  let processedBinding = resultsBinding.filter(
    a => a.p.value.slice(28).length > 1 &&
         (a.p.value.includes("ontology") || a.p.value.includes("property")) &&
         !(a.p.value.includes("wikiPage") 
         || a.p.value.includes("align") 
         || a.p.value.includes("abstract") 
         || a.p.value.includes("caption") 
         || a.p.value.includes("image") 
         || a.p.value.includes("width") 
         || a.p.value.includes("thumbnail") 
         || a.p.value.includes("blank")
         || a.p.value.includes("fec")
         || a.p.value.includes("viaf")
         || a.p.value.includes("soundRecording")
         || a.p.value.includes("votesmart")
         || a.p.value.includes("wordnet")
         || a.p.value.includes("float")
         || a.p.value.includes("bbr")
         || a.p.value === "http://dbpedia.org/property/alt"
         || a.p.value === "http://dbpedia.org/property/by"
         || a.p.value === "http://dbpedia.org/property/onlinebooks"
         || a.p.value === "http://dbpedia.org/property/signature"
         || a.p.value === "http://dbpedia.org/property/video"
         )
  );

  // We then do some filtering based on subPropertyOf.
  // Because of our observation, we only want to keep entries whose subPropertyOf attribute is from the DUL dataset.
  // processedBinding = processedBinding.filter(a => a.subPropertyOf === undefined || a.subPropertyOf.value.includes("DUL.owl"));
  processedBinding = processedBinding.filter(function(a) {
    if (a.subPropertyOf !== undefined) {
      return a.subPropertyOf.value.includes("DUL.owl");
    }
    return true;
  })

  // we then sort the resultsBinding by p.value.slice(28)
  processedBinding = processedBinding.sort((a, b) =>
    a.p.value.slice(28) > b.p.value.slice(28) ? 1 : -1
  );

  // we take a look at processedBinding at this stage
  // console.log(processedBinding);

  // Let's only start the loop is processedBinding is non-empty
  if (processedBinding.length > 0) {
    // We set count of neighbour ready to be added
    let neighbourCount = 1;  

    // We set literal of neighbour ready to be added.
    // Morever, we get the value of the neighbour ready to be added, depending on type.
    // Initialized with the first neighbour.

    let neighbourToAdd = processedBinding[0].p.value.slice(28); 
    let valuesToAdd = [];
    valuesToAdd.push(type === "subject" ? removePrefix(processedBinding[0].o.value) : removePrefix(processedBinding[0].s.value))

    // we set range of neighbour ready to be added. "" if doesn't exist.
    let neighbourRange = processedBinding[0].range !== undefined ? processedBinding[0].range.value : "";

    // we the subPropertyOf of neighbour ready to be added. "" if doesn't exist.
    let neighbourSubPropertyOf = processedBinding[0].subPropertyOf !== undefined ? processedBinding[0].subPropertyOf.value : "";
    
    // We loop over processedBinding
    for (let i = 1; i < processedBinding.length; ++i) {
      let curNeighbour = processedBinding[i].p.value.slice(28);
      // If the current neighbour is equal to neighbourToAdd, we increment the count, and push valuesToAdd
      if (curNeighbour === neighbourToAdd) {
        ++neighbourCount;
        valuesToAdd.push(type === "subject" ? removePrefix(processedBinding[i].o.value) : removePrefix(processedBinding[i].s.value))
      }
      // else, we decide if we want to push neighbourToAdd to keyColNeighbours. 
      // We push if neighbourCount is <= maxNeighbourCount
      else {
        // First determine if we wnat to push
        if (neighbourCount <= maxNeighbourCount) {
          // set value.
          let objValue = neighbourToAdd;
          // set label. We want to change the neighbour label if type === "object".
          let objLabel = neighbourToAdd;
          if (type === "object") {
            objLabel = "is " + objLabel + " of";
          }
          // set type
          let objType = type;
          // set count
          let objCount = neighbourCount;
          // set data
          let objData = valuesToAdd;
          // set range
          let objRange = neighbourRange;
          // set subPropertyOf
          let objSubPropertyOf = neighbourSubPropertyOf;

          // Set object from all its attributes
          let tempObj = {
            "value":objValue, 
            "label":objLabel, 
            "type":objType, 
            "count":objCount, 
            "filledCount":1, 
            "data":objData,
            "range":objRange,
            "subPropertyOf":objSubPropertyOf
          };
          // we push this tempObj onto keyColNeighbours
          keyColNeighbours.push(tempObj)
        }
        // Regardless of pushing or not, 
        // we now need to reset neighbourCount, neighbourToAdd, neighbourRange, neighbourSubPropertyOf, and valuesToAdd
        neighbourCount = 1;
        neighbourToAdd = curNeighbour;
        valuesToAdd = [type === "subject" ? removePrefix(processedBinding[i].o.value) : removePrefix(processedBinding[i].s.value)];
        neighbourRange = processedBinding[i].range !== undefined ? processedBinding[i].range.value : "";
        neighbourSubPropertyOf = processedBinding[i].subPropertyOf !== undefined ? processedBinding[i].subPropertyOf.value : "";
      }
    }
    // Now, after the loop is done, we need to do one more iteration to determine whether we want to add the last neighbour.
    if (neighbourCount <= maxNeighbourCount) {
      // set value.
      let objValue = neighbourToAdd;
      // set label. We want to change the neighbour label if type === "object".
      let objLabel = neighbourToAdd;
      if (type === "object") {
        objLabel = "is " + objLabel + " of";
      }
      // set type
      let objType = type;
      // set count
      let objCount = neighbourCount;
      // set data
      let objData = valuesToAdd;
      // set range
      let objRange = neighbourRange;
      // set subPropertyOf
      let objSubPropertyOf = neighbourSubPropertyOf;

      // Set object from all its attributes
      let tempObj = {
          "value":objValue, 
          "label":objLabel, 
          "type":objType, 
          "count":objCount, 
          "filledCount":1, 
          "data":objData,
          "range":objRange,
          "subPropertyOf":objSubPropertyOf
        };
      // we push this tempObj onto keyColNeighbours
      keyColNeighbours.push(tempObj)
    }
  }

  // console.log(keyColNeighbours);
  // console.log(processedBinding);

  return keyColNeighbours;
}

// This helper function is designed to process the result bindings passed from contextCellPreview.
// It should share some similarity with updateKeyColNeighbours

// It takes two parameters:
//  1) array "resultsBinding", storing the returned result of queryURL from Virtuoso
//  2) string "type", either "subject" or "object"

// It returns previewInfoArray, a list of objects used to display a cell's preview info
// This object has two properties:
// 1) key: a string
// 2) value: an array of strings
function updatePreviewInfo(resultsBinding, type) {
  // console.log(previewInfoArray);
  // console.log(resultsBinding);
  // console.log(type);

  // Let's do some preprocessing of resultsBinding. We want to do sorting, deduping, and some filtering.

  // we first filter out those in resultsBinding according to three criterias

  // 1) p.value.slice(28).length must > 1
  // 2) p.value must include "ontology" or "property" (so it is one of dbo:XXXX or dbp:XXXX)
  // 3) p.value must not include certain strings (which likely correspond to meaningless attributes)

  let processedBinding = resultsBinding.filter(
    a => a.p.value.slice(28).length > 1 &&
         (a.p.value.includes("ontology") || a.p.value.includes("property")) &&
         !(a.p.value.includes("wikiPage") 
         || a.p.value.includes("align") 
         || a.p.value.includes("abstract") 
         || a.p.value.includes("caption") 
         || a.p.value.includes("image") 
         || a.p.value.includes("width") 
         || a.p.value.includes("thumbnail") 
         || a.p.value.includes("blank")
         || a.p.value.includes("fec")
         || a.p.value.includes("viaf")
         || a.p.value.includes("soundRecording")
         || a.p.value.includes("votesmart")
         || a.p.value.includes("wordnet")
         || a.p.value.includes("float")
         || a.p.value.includes("bbr")
         || a.p.value === "http://dbpedia.org/property/alt"
         || a.p.value === "http://dbpedia.org/property/by"
         || a.p.value === "http://dbpedia.org/property/onlinebooks"
         || a.p.value === "http://dbpedia.org/property/signature"
         || a.p.value === "http://dbpedia.org/property/video"
         )
  );


  // we then sort the resultsBinding by p.value.slice(28)
  processedBinding = processedBinding.sort((a, b) =>
    a.p.value.slice(28) > b.p.value.slice(28) ? 1 : -1
  );

  // Now let's create the previewInfoArray based on processedBinding
  // console.log(processedBinding);

  let previewInfoArray = [];

  if (processedBinding.length > 1) {
    // We first push on the first element from processedBinding

    previewInfoArray.push(
      {
        "key": type === "subject" ? processedBinding[0].p.value.slice(28) : "is "+processedBinding[0].p.value.slice(28)+" of",
        "value": [removePrefix(processedBinding[0].value.value)],
      }
    )
    let curIndex = 0;
    for (let i = 1; i < processedBinding.length; ++i) {
      let curNeighbour = processedBinding[i].p.value.slice(28);
      let prevNeighbour = processedBinding[i-1].p.value.slice(28);
      // console.log(curNeighbour);
      // console.log(prevNeighbour);

      // If this neighbour is the same as the previous one, we want to append this neighbour's value
      // to the element's value array in previewInfoArray at curIndex
      if (curNeighbour === prevNeighbour) {
        // Note, we dont want each element in previewInfoArray to contain too many elements (5), so we do a check here.
        if (previewInfoArray[curIndex].value.length < 5) {
          previewInfoArray[curIndex].value.push(removePrefix(processedBinding[i].value.value));
        }
      }
      // Else, we push a fresh element onto previewInforArray, and update curIndex
      else {
        previewInfoArray.push(
          {
            "key": type === "subject" ? processedBinding[i].p.value.slice(28) : "is "+processedBinding[i].p.value.slice(28)+" of",
            "value":[removePrefix(processedBinding[i].value.value)],
          }
        )
        ++curIndex;
      }
    }
    // console.log(previewInfoArray);
  }
  return previewInfoArray;
}

// This function processes the resultsBinding passed from handleStartSubject, to create the info needed for Action Panel.
// It should share some similarity with updatePreviewInfo

// It takes one parameter:
// 1) array "resultsBinding", storing the returned result of queryURL from Virtuoso
// Note: "type" parameter is not needed, since we are not dealing with object neighbours

function updateFirstColSelection(resultsBinding) {

  // we first filter out those in resultsBinding according to three criterias
  // Note: the second criteria is a bit different from updateKeyColNeighbours and updatePreviewInfo

  // 1) p.value.slice(28).length must > 1
  // 2) p.value must include "ontology", "property", or "dc/terms/subject" (so it is one of dbo:XXXX, dbp:XXXX, or dct:subject)
  // 3) p.value must not include certain strings (which likely correspond to meaningless attributes)

  let processedBinding = resultsBinding.filter(
    a => a.p.value.slice(28).length > 1 
         &&
         (a.p.value.includes("ontology") 
         || a.p.value.includes("property")
         || a.p.value.includes("dc/terms/subject")
         ) 
         &&
         !(a.p.value.includes("wikiPage") 
         || a.p.value.includes("align") 
         || a.p.value.includes("abstract") 
         || a.p.value.includes("caption") 
         || a.p.value.includes("image") 
         || a.p.value.includes("width") 
         || a.p.value.includes("thumbnail") 
         || a.p.value.includes("blank")
         || a.p.value.includes("fec")
         || a.p.value.includes("viaf")
         || a.p.value.includes("soundRecording")
         || a.p.value.includes("votesmart")
         || a.p.value.includes("wordnet")
         || a.p.value.includes("float")
         || a.p.value.includes("bbr")
         || a.p.value === "http://dbpedia.org/property/alt"
         || a.p.value === "http://dbpedia.org/property/by"
         || a.p.value === "http://dbpedia.org/property/onlinebooks"
         || a.p.value === "http://dbpedia.org/property/signature"
         || a.p.value === "http://dbpedia.org/property/video"
         )
  );
  
  // We then sort the processedBinding by the following criteria:
  // 1) dct:subjects should show up at the top of the list
  // 2) ther sort by p.value

  // Since a customized sort is a bit hard to write, let's break this array into two, sort each one, then concat them back together
  let dctArray = [];
  let dbopArray = [];
  for (let i = 0; i < processedBinding.length; ++i) {
    if (processedBinding[i].p.value === "http://purl.org/dc/terms/subject") {
      dctArray.push(processedBinding[i]);
    }
    else {
      dbopArray.push(processedBinding[i]);
    }
  }

  dctArray.sort((a, b) => (a.o.value.slice(37) < b.o.value.slice(37) ? -1 : 1));

  // We want to sort dbop array by the following rules
  // Those that are dbr (so without a datatype) shows up higher
  // Then those with a smaller count shows up higher
  // Then alphabetical order.

  // The following code gets the count for each property(or neighbour)
  dbopArray.sort((a, b) => (a.p.value.slice(28) < b.p.value.slice(28) ? -1 : 1));
  dbopArray[0].p.count = getPCount(dbopArray[0].p.value, dbopArray);
  for (let i = 1; i < dbopArray.length; ++i) {
    let prevNeighbour = dbopArray[i-1];
    let curNeighbour = dbopArray[i];
    if (prevNeighbour.p.value === curNeighbour.p.value) {
      curNeighbour.p.count = prevNeighbour.p.count;
    }
    else {
      curNeighbour.p.count = getPCount(dbopArray[i].p.value, dbopArray);
    }
  }

  // The following code sorts the array
  dbopArray.sort(function (a, b) {
    if (a.o.datatype === undefined && b.o.datatype !== undefined) {
      return -1;
    }
    else if (b.o.datatype === undefined && a.o.datatype !== undefined) {
      return 1;
    }
    else {
      if (a.p.count === b.p.count) {
        return a.p.value.slice(28) < b.p.value.slice(28) ? -1 : 1;
      }
      else {
        return a.p.count < b.p.count ? -1 : 1;
      }
    }
  });
  // console.log(dbopArray);

  processedBinding = dctArray.concat(dbopArray);

  // console.log(processedBinding);

  // Now we need to loop over the processedBinding, and create an array of objects. 
  // This array should have length equal to processedBinding.length.
  // Each object should have 6 attributes.
  // 1) pValue: value of predicate
  // 2) pDataset: which dataset does this predicate belong to (one of dbo, dbp, and dct)
  // 3) oValue: value of object
  // 4) oType: datatype of object, such as "http://www.w3.org/2001/XMLSchema#date". This can be empty.

  // 5) value: same as pValue: historical code
  // 6) label: same as pValue: historical code

  let firstColSelection = [];

  for (let i = 0; i < processedBinding.length; ++i) {
    // First case: current neighbour is from dct:subject
    if (processedBinding[i].p.value === "http://purl.org/dc/terms/subject") {
      firstColSelection.push(
        {
          "pValue":"category",
          "pDataset":"dct",
          "oValue":processedBinding[i].o.value.slice(37),
          "oType":"",
          "value":"category",
          "label":"category:"+processedBinding[i].o.value.slice(37),
        }
      )
    }
    // Second case: current neighbour is from dbo or dbp
    else {
      firstColSelection.push(
        {
          "pValue":processedBinding[i].p.value.slice(28),
          "pDataset":processedBinding[i].p.value.includes("property") ? "dbp" : "dbo",
          "oValue":removePrefix(processedBinding[i].o.value),
          "oType":processedBinding[i].o.datatype === undefined ? "" : processedBinding[i].o.datatype,
          "value":processedBinding[i].p.value.slice(28),
          "label":processedBinding[i].p.value.slice(28)+":"+removePrefix(processedBinding[i].o.value),
        }
      )
    }
  }
  return firstColSelection;
}


// This function takes in the clean data for the first table, clean data for the second table, and colMapping between these two tables
// And returns the unioned clean data for the first table

function tableConcat(tableData, otherTableData, tempMapping) {
  // We want to correctly modify tableDataExplore, based on colMapping.
  // If colMapping is null for some column, we want to set the data as "N/A"
  // console.log(tableDataExplore);

  // We first make some small modifications to colMapping, as we have inserted a new column into otherTableData and tableDataExplore
  for (let j = 0; j < tempMapping.length; ++j) {
    if (tempMapping[j] !== "null") {
      tempMapping[j]++;
    }
  }
  tempMapping.splice(0, 0, 0); // insert element 0 at the first position of colMapping, deleting 0 elements

  // Now we insert the data into dataToAdd. dataToAdd will be concatenated with tableDataExplore
  let dataToAdd = [];
  for (let i = 0; i < otherTableData.length; ++i) {
    let tempRow = [];
    for (let j = 0; j < tempMapping.length; ++j) {
      let colInNew = tempMapping[j];
      if (colInNew !== "null") {
        tempRow.push(otherTableData[i][colInNew]);
      } else {
        tempRow.push({ data: "N/A" });
      }
    }
    dataToAdd.push(tempRow);
  }
  return tableData.concat(dataToAdd);
}

function HTMLCleanCell(str) {
  // Note that this function also removes leading and trailing whitespaces
  if (str[str.length - 1] === "\n") {
    return str.slice(0, -1).trim().split("[")[0];
  } else {
    return str.trim().split("[")[0];
  }
}

// This function returns an array of table objects that are unionable with the selected table.

// It taks two parameters:
//  1) HTML "tableHTML" storing the HTML of the selected table
//  2) HTML "pageHTML", storing the HTML of a sibling page

// Table object has four attributes: isOpen, data, unionScore, colMapping

// Once semantic mapping feature is added, the colMapping will be updated

function findTableFromHTML(
  tableHeader,
  pageHTML,
  selectedClassAnnotation,
  semanticEnabled,
  unionCutOff,
  pageName
) {
  // We first get the column names of the table in the table panel, using this.state.tableHeader.
  // Note: the index starts from 1 because we don't care about the originURL column (column 0). ***
  let originCols = [];
  // BUGFIX needs to be applied here. (Seems to be fixed)
  // console.log(tableHeader);
  for (let j = 1; j < tableHeader.length; ++j) {
    let curValue = ""
    for (let k = 0; k < tableHeader[j].length; ++k) {
      curValue+=tableHeader[j][k].value;
    }
    originCols.push(curValue);
  }

  // We now fetch all the tables from pageHTML (the current sibling page)
  let doc = new DOMParser().parseFromString(pageHTML, "text/html");
  let wikiTablesFound = doc.getElementsByClassName("wikitable");
  let tablesFound = [];
  for (let i = 0; i < wikiTablesFound.length; ++i) {
    if (wikiTablesFound[i].tagName !== "TH") {
      tablesFound.push(wikiTablesFound[i]);
    }
  }

  // console.log(tablesFound);

  // This is the array we will return.
  let tableArray = [];

  // We now loop through all the tables found on this sibling page, and see if they are unionable with the selected table
  let tablePromise = [];
  for (let i = 0; i < tablesFound.length; ++i) {
    tablePromise.push(
      findTableFromTable(
        tablesFound[i],
        originCols,
        selectedClassAnnotation,
        semanticEnabled,
        unionCutOff,
        pageName
      )
    );
  }

  return allPromiseReady(tablePromise).then((values) => {
    for (let i = 0; i < values.length; ++i) {
      tableArray.push(values[i]);
    }
    // we filter the tableArray here by removing those tables that do not have a high enough unionScore
    // Note: In the unfiltered table array, we are using -1 to represent tables with a low unionScore
    tableArray = tableArray.filter(function (x) {
      return x !== -1;
    });
    // console.log(tableArray);
    // We sort the tableArray here by unionScore
    tableArray.sort((a, b) => (a.unionScore < b.unionScore ? 1 : -1));
    return Promise.resolve(tableArray);
  });
}

// This function takes in four parameters:

// 1) a tableHTML
// 2) originCols (denoting the columns names of the selected table)
// 3) class annotation of the selected table
// 4) whether semantic mapping is enabled or not

// and return a table Object with properties: isOpen, unionScore, colMapping, and data
function findTableFromTable(
  tableHTML,
  originCols,
  selectedClassAnnotation,
  semanticEnabled,
  unionCutOff,
  pageName
) {
  // Define some constants
  const ontologySize = 780;
  const matchCutOff = 0.999;

  // We first fetch the cleaned column names of the current table
  let curHeaderCells = tableHTML.rows[0].cells;
  let newCols = []; // stores the cleaned column names of the this table. Let's consider using this value for display as well.
  let remainCols = []; // stores an array of the indices of the columns of the current table that are not yet mapped
  let searchCols = []; // stores an array of the indices of the columns from the selected table that are not yet mapped

  // We potentially need to resort to semantic mapping. So let's create a promiseArray.
  // This promiseArray will only contain one element
  let promiseArray = [];

  for (let j = 0; j < curHeaderCells.length; ++j) {
    let headerName = HTMLCleanCell(curHeaderCells[j].innerText);
    newCols.push(headerName);
    remainCols.push(j);
  }

  // we want to make sure that newTable has more than half of the columns of the selectedTable
  // because we require a >50% unionScore
  // If it does not, we ignore this table automatically

  if (newCols.length >= originCols.length * unionCutOff) {
    // We use the proposed algo here.
    // First we set the union score and column Mapping
    let unionScore = 0;
    let colMapping = [];
    // We loop through the column headers in originCol, and see if they exist in newCols.
    for (let k = 0; k < originCols.length; ++k) {
      let curIndex = newCols.indexOf(originCols[k]);
      if (curIndex !== -1) {
        // This means the new table also contains column k from the selected table
        // Thus we have found a mapping. We push it onto colMapping.
        colMapping.push(curIndex);
        unionScore += 1 / originCols.length;
      } else {
        colMapping.push("null");
      }
    }
    // In here we do a bit of string matching for tables with the same number of columns
    // Chances are: tables from sibling pages with the same number of columns as the selected table, with structual invariability,
    // is likely to be the "same" table as the selected on, we give it a chance for string matching
    if (newCols.length === originCols.length) {
      let sameStructure = true;
      for (let i = 0; i < colMapping.length; ++i) {
        if (colMapping[i] !== "null" && colMapping[i] !== i) {
          sameStructure = false;
          break;
        }
      }
      if (sameStructure === true) {
        for (let i = 0; i < colMapping.length; ++i) {
          if (colMapping[i] === "null") {
            if (
              newCols[i].includes(originCols[i]) ||
              originCols[i].includes(newCols[i])
            ) {
              colMapping[i] = i;
              unionScore += 1 / originCols.length;
            }
          }
        }
      }
      // console.log(colMapping);
      // If unionScore is 1, and newCols.length is equal to originCols.length, we want to reward it with 0.01 unionScore
      // This helps us to rank the tables with the exact same column headers a bit higher
      if (unionScore === 1) {
        unionScore += 0.01;
      }
    }

    // We proceed differently based on whether semantic mapping is enabled or not

    // Case 1: semantic mapping is enabled

    if (semanticEnabled === "enabled") {
      // If we are not finding a perfect match, we want to do use semantic mapping here to see if it's possible to map the unmapped columns
      // Note: this part is expected to take quite some time. Now it's implemented just for testing purposes
      if (unionScore < 0.999) {
        // We want to remove from remainCols the columns that are already mapped
        // The remaining will be the columns that we can still use from the current table
        remainCols = remainCols.filter(function (x) {
          return colMapping.indexOf(x) < 0;
        });
        for (let i = 0; i < colMapping.length; ++i) {
          if (colMapping[i] === "null") {
            searchCols.push(i);
          }
        }
        // if (newCols[1] === "Scorer") {
        // console.log("We still need to find these columns from the original table: "+searchCols);
        // console.log("These columns are still available for use: "+remainCols);
        // console.log("The current column mappings are "+colMapping);
        // console.log("Here are the class annotations of the search columns: ")
        // for (let i=0;i<searchCols.length;++i) {
        //   console.log(selectedClassAnnotation[searchCols[i]]);
        // }
        // }

        // Now, searchCols stores the columns from the selected table that have not been mapped yet
        // and remainCols stores the columns from the current table that can still be used for mapping
        // Let's ask a query to find the class annotations for the remainCols
        // if (remainCols.length > 0) {
        promiseArray.push(findClassAnnotation(tableHTML, remainCols, pageName));
        // }
      }

      // Because the return statement is here, it may be possible that we are pushing nothing onto the promiseArray!!!
      // There is no need to worry about it.
      return allPromiseReady(promiseArray).then((values) => {
        // First, if we are in the perfect match case, we want to retrun straight away
        if (unionScore >= 0.999) {
          return Promise.resolve({
            isOpen: false,
            unionScore: unionScore,
            colMapping: colMapping,
            data: tableHTML,
            title: newCols,
          });
        }
        // Else, we want to look for semantic mapping opportunities
        else {
          // create a copy of values

          // Note!!!! Sometimes the tableHTML only has one row, so values[0] would have a length of zero, in which case our algo breaks down
          // Let's prevent it from happening
          let remainClassAnnotation = values[0].slice();
          if (remainClassAnnotation.length > 0) {
            // let remainColsCopy = remainCols.slice();
            // let remainClassAnnotationCopy = remainClassAnnotation.slice();
            for (let i = 0; i < searchCols.length; ++i) {
              let curSearchIndex = searchCols[i];
              // console.log(curSearchIndex);
              // console.log(selectedClassAnnotation[curSearchIndex]);

              // If the class annotation for this column is empty, we skip it because there's no hope for semantic match.
              // Otherwise we can work with it
              if (selectedClassAnnotation[curSearchIndex].length > 0) {
                // console.log("Current column being searched has index: "+curSearchIndex);
                // console.log(selectedClassAnnotation[curSearchIndex]);

                // we loop through the remain cols and check their class annotations
                for (let j = 0; j < remainCols.length; ++j) {
                  // Let make sure this column does have a class annotation. Otherwise we skip it
                  // console.log(remainClassAnnotation[j]);
                  // Note: sometimes remainClassAnnotation[j] is undefined, which causes an error
                  // if (remainClassAnnotation[j] === undefined) {
                  //   console.log("This case is causing an error");
                  //   console.log("Remain cols are "+remainCols);
                  //   console.log("Remain class annotations are "+remainClassAnnotation);
                  //   console.log("Original remain cols are "+remainColsCopy);
                  //   console.log("original remain class annotations are "+remainClassAnnotationCopy);
                  //   console.log("Table HTML is ");
                  //   console.log(tableHTML);
                  //   console.log(values[0]);
                  // }
                  if (remainClassAnnotation[j].length > 0) {
                    // console.log("Remain column index is "+remainCols[j]);
                    // console.log("Its class annotation is "+remainClassAnnotation[j]);
                    // Let make special cases when the any of search column class and current column class is [Number]
                    // If they are both [Number], we will give it a match
                    // Else it's not a match
                    if (
                      selectedClassAnnotation[curSearchIndex][0] === "Number" ||
                      remainClassAnnotation[j][0] === "Number"
                    ) {
                      // This case we have a match
                      if (
                        selectedClassAnnotation[curSearchIndex][0] ===
                        remainClassAnnotation[j][0]
                      ) {
                        // We need to update the colMapping and unionScore
                        colMapping[curSearchIndex] = remainCols[j];
                        unionScore += 1 / originCols.length;
                        // we also need to remove this column from remainClassAnnotation and remainCols because we cannot use it anymore
                        remainCols.splice(j, 1);
                        remainClassAnnotation.splice(j, 1);
                        // Also, since we are removing element from remainCols array and remainClassAnnotation array, we need to decrement
                        // j to go back to the correct posiition
                        --j;
                        // Also we need to call break to prevent further looping: we are done with this search column
                        break;
                      }
                      // Else there is no match. We simply ignore it.
                    }
                    // If neither of them is [Number], we need to use the test statistic
                    else {
                      // Let's first find the array intersection of selectedClassAnnotation[curSearchIndex] and remainClassAnnotation[j]
                      let intersection = selectedClassAnnotation[
                        curSearchIndex
                      ].filter(function (x) {
                        return remainClassAnnotation[j].indexOf(x) >= 0;
                      });
                      // console.log("Intersection is "+intersection);
                      // We only want to consider two column unionable if they at least have some intersections.
                      if (intersection.length > 0) {
                        let totalSuccess =
                          selectedClassAnnotation[curSearchIndex].length;
                        let numTrial = remainClassAnnotation[j].length;
                        let numSuccess = intersection.length;
                        let testStat = hyperCDF(
                          numSuccess,
                          ontologySize,
                          totalSuccess,
                          numTrial
                        );
                        // If testStat is larger than matchCutOff, we consider it a match
                        if (testStat > matchCutOff) {
                          // We need to update the colMapping and unionScore
                          colMapping[curSearchIndex] = remainCols[j];
                          unionScore += 1 / originCols.length;
                          // we also need to remove this column from remainClassAnnotation and remainCols because we cannot use it anymore
                          remainCols.splice(j, 1);
                          remainClassAnnotation.splice(j, 1);
                          // Also, since we are removing element from remainCols array and remainClassAnnotation array, we need to decrement
                          // j to go back to the correct posiition
                          --j;
                          // Also we need to call break to prevent further looping: we are done with this search column
                          break;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          // console.log("Remain columns are "+)
          // console.log("Here is table HTML");
          // console.log(tableHTML);
          // console.log("Here are the class annotations for columns that still need mapping");
          // for (let i=0;i<searchCols.length;++i) {
          //   console.log(selectedClassAnnotation[searchCols[i]]);
          // }
          // console.log("The remain columns are "+remainCols);
          // console.log("Here are the class annotations for the remaining columns");
          // console.log(values);
          // console.log("This is column mapping "+colMapping);
          // console.log("Union score is "+unionScore);

          // We need to loop through the searchCols

          // We push on tables with unionScore > unionCutOff
          if (unionScore >= unionCutOff) {
            // console.log("This table is unionable!");
            // console.log("Table is "+tableHTML);
            // console.log("Union Score is "+unionScore);
            // console.log("Column mapping is "+colMapping);
            // tableArray.push({"isOpen":false,"unionScore":unionScore,"colMapping":colMapping,"data":tablesFound[i]});
            // console.log(colMapping);
            return Promise.resolve({
              isOpen: false,
              unionScore: unionScore,
              colMapping: colMapping,
              data: tableHTML,
              title: newCols,
            });
          } else {
            return Promise.resolve(-1);
          }
        }
      });
    }

    // Case 2: semantic mapping is disabled.
    // In this case we check if the unionScore is high enough directly, without going through the semantic mapping process
    else {
      // We push on tables with unionScore > unionCutOff
      if (unionScore >= unionCutOff) {
        // console.log("This table is unionable!");
        // console.log("Table is "+tableHTML);
        // console.log("Union Score is "+unionScore);
        // console.log("Column mapping is "+colMapping);
        // tableArray.push({"isOpen":false,"unionScore":unionScore,"colMapping":colMapping,"data":tablesFound[i]});
        // console.log(colMapping);
        return Promise.resolve({
          isOpen: false,
          unionScore: unionScore,
          colMapping: colMapping,
          data: tableHTML,
          title: newCols,
        });
      } else {
        return Promise.resolve(-1);
      }
    }
  }
  // This else clause means that this table does not even have enough number of columns.
  // So we know right away it cannot be a match. So we return -1 (failure)
  else {
    return Promise.resolve(-1);
  }
}

// This function takes in the HTML of a table, and returns a Promise that resolves to the class annotation for all the columns of the table
function findClassAnnotation(tableHTML, remainCols, pageName) {
  // console.log("Page Name is: "+pageName);
  // console.log("Table HTML is: ");
  // console.log(tableHTML);
  // console.log(remainCols);
  let selectedTable = tableHTML;
  let tempTable = [];

  // We first fetch the plain, unprocessed version of the table.
  // Note: this function potentially needs to be modified.
  // Instead of using innerText for cell data, if its href exists, we should use its href instead
  for (let i = 0; i < selectedTable.rows.length; ++i) {
    let tempRow = [];
    for (let j = 0; j < selectedTable.rows[i].cells.length; ++j) {
      let curCellText = HTMLCleanCell(selectedTable.rows[i].cells[j].innerText);

      // Note: We want to use the href as data for the first column (if such href exists) instead of its innerText.
      if (i === 1) {
        // We get all the links from this current cell (there may be more than one)
        let anchorArray = selectedTable.rows[i].cells[j].getElementsByTagName(
          "a"
        );
        // we want to use the first valid link as the search element for this cell
        // Definition of being valid: its associated innerText is not empty (thus not the link of a picture)
        //                            and it is not a citation (so [0] is not "[")
        for (let k = 0; k < anchorArray.length; ++k) {
          if (
            anchorArray[k].innerText !== "" &&
            anchorArray[k].innerText[0] !== "["
          ) {
            let hrefArray = anchorArray[k].href.split("/");
            // console.log("InnerText is "+anchorArray[k].innerText);
            // console.log("It exists in DBPedia as "+hrefArray[hrefArray.length-1]);
            curCellText = hrefArray[hrefArray.length - 1];
            // if (curCellText.includes("UEFA")) {
            // console.log(curCellText);
            // }
          }
        }
      }
      let curRowSpan = selectedTable.rows[i].cells[j].rowSpan;
      let curColSpan = selectedTable.rows[i].cells[j].colSpan;
      // console.log(curColSpan);
      tempRow.push({
        data: curCellText,
        rowSpan: curRowSpan,
        colSpan: curColSpan,
      });
    }
    tempTable.push(tempRow);
  }

  // We first deal with colspans.
  for (let i = 0; i < tempTable.length; ++i) {
    for (let j = 0; j < tempTable[i].length; ++j) {
      let curCellText = tempTable[i][j].data;
      if (tempTable[i][j].colSpan > 1) {
        for (let k = 1; k < tempTable[i][j].colSpan; ++k) {
          tempTable[i].splice(j + 1, 0, {
            data: curCellText,
            rowSpan: 1,
            colSpan: 1,
          });
        }
      }
    }
  }

  // We now deal with rowspans.
  for (let i = 0; i < tempTable.length; ++i) {
    for (let j = 0; j < tempTable[i].length; ++j) {
      let curCellText = tempTable[i][j].data;
      if (tempTable[i][j].rowSpan > 1) {
        for (let k = 1; k < tempTable[i][j].rowSpan; ++k) {
          // Note: the if condition is necessary to take care of error conditions (the original HTML table element has errors)
          if (i + k < tempTable.length) {
            tempTable[i + k].splice(j, 0, {
              data: curCellText,
              rowSpan: 1,
              colSpan: 1,
            });
          }
        }
      }
    }
  }

  // console.log("Table data is: ");
  // console.log(tempTable);

  // Now tempTable contains the clean data we can use
  let promiseArray = [];
  // We take the minimum of (1, tempTable.length-1) number of values from each column to determine its class annotation
  // Note!! This -1 here is important. It excludes the row corresponding to the column headers
  let remainEntries = Math.min(1, tempTable.length - 1);

  // This is a placeholder array to solve the 2D problem. It's a 1D array containing remainEntries number of -1's
  // let placeHolderArray = [];
  // let notFoundArray = [];
  // for (let i=0;i<remainEntries;++i) {
  //   placeHolderArray.push(-1);
  //   notFoundArray.push("null");
  // }

  // Let's loop through the table to ask our queries.
  // If remainCols are undefined, we take every columns from the tempTable;
  if (remainCols === undefined) {
    remainCols = [];
    for (let j = 0; j < tempTable[0].length; ++j) {
      remainCols.push(j);
    }
  }

  // console.log("Remain columns are: "+remainCols);
  for (let j = 0; j < remainCols.length; ++j) {
    // console.log("We are taking this number of entries from this table: "+remainEntries);
    // Find the current column index
    let curColIndex = remainCols[j];
    // console.log("Current column index is: "+curColIndex);

    // Loop through the first three (or one) entries from this column
    for (let i = 1; i <= remainEntries; ++i) {
      // Here we make the query
      let prefixURL =
        "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
      let suffixURL =
        "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
      // console.log(tempTable[i][j].data);
      // console.log(regexReplace(tempTable[i][j].data));
      // console.log(tempTable[i][curColIndex]);
      let curEntry =
        tempTable[i][curColIndex] === undefined
          ? "NONEXISTING"
          : regexReplace(tempTable[i][curColIndex].data);
      // console.log(curEntry);
      // console.log(regexReplace(tempTable[i][curColIndex].data));
      // console.log(!isNaN(Number(curEntry)));
      // console.log("Replaced data is "+curEntry);
      // console.log(curEntry === "");

      // If we found out that the current entry is a number, we do not want to send a query.
      // Note: Number("") will show up as a number!! This was one of the bugs that we fixed
      if (!isNaN(Number(curEntry)) && curEntry !== "") {
        promiseArray.push(Promise.resolve(["Number"]));
      }
      // Else if we find the curEntry is too long, it will likely not exist in DBPedia
      else if (curEntry.length > 40) {
        promiseArray.push(Promise.resolve(["Null"]));
      }
      // Else we construct the query
      else {
        // console.log("Cur Entry is "+curEntry);
        if (curEntry === undefined || curEntry === "") {
          curEntry = "NONEXISTING";
        }
        // if (curEntry === "Sergio_Agüero") {
        //   console.log("We have another problem here");
        // }
        // console.log(curEntry);
        // console.log(tempTable[i][curColIndex].data);
        // console.log(regexReplace(tempTable[i][curColIndex].data));
        let queryBody =
          "SELECT+%3Fo%0D%0AWHERE+%7B%0D%0A++++++dbr%3A" +
          curEntry +
          "+rdf%3Atype+%3Fo.%0D%0A++++++BIND%28STR%28%3Fo%29+AS+%3FoString+%29.%0D%0A++++++FILTER%28regex%28%3FoString%2C%22dbpedia.org%2Fontology%2F%22%2C%22i%22%29%29%0D%0A%7D%0D%0A&";
        let queryURL = prefixURL + queryBody + suffixURL;
        // if (curEntry === "Bangor_City_F%5Cu002EC%5Cu002E") {
        //   console.log("There is something wrong with this entry")
        //   console.log(queryURL);
        // }
        // console.log("Query is constructed!");
        // if (queryURL === "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=SELECT+%3Fo%0D%0AWHERE+%7B%0D%0A++++++dbr%3A") {
        //   console.log("Here is where the problem occurs");
        // }
        // console.log(queryURL);
        promiseArray.push(fetchJSON(queryURL));
        // console.log("Query pushed successfully. This is queryBody: ");
        // console.log(queryBody);
      }
    }
  }
  return allPromiseReady(promiseArray).then((values) => {
    // console.log(values);
    // for (let i=0;i<values.length;++i) {
    //   console.log(values[i]);
    // }
    // console.log("Query results from Virtuoso are:");
    // console.log(values);
    let classAnnotation = [];
    for (let j = 0; j < remainCols.length; ++j) {
      // console.log("Number of remain cols is "+remainCols.length);
      let curColumnClass = [];
      // If we are dealing with number results, we just want to push on an array with one element "Number"
      if (values[remainEntries * j] !== undefined) {
        if (values[remainEntries * j][0] !== undefined) {
          if (values[remainEntries * j][0] === "Number") {
            classAnnotation.push(["Number"]);
          }
          // If we are dealing with invalid results, we just want to push on an empty array
          else if (values[remainEntries * j][0] === "Null") {
            classAnnotation.push([]);
          }
        }
        // if (values[remainEntries*j][0] === -1) {
        //   classAnnotation.push(["Number"]);
        // }
        // // If we are dealing with invalid results, we just want to push on an empty array
        // else if (values[remainEntries*j][0] === "null") {
        //   classAnnotation.push([]);
        // }
        // Else, we find its class annotation from query results
        else {
          for (let i = 0; i < remainEntries; ++i) {
            let curCellClass = [];
            // console.log(remainEntries*j+i);
            let bindingArray = values[remainEntries * j + i].results.bindings;
            for (let k = 0; k < bindingArray.length; ++k) {
              curCellClass.push(bindingArray[k].o.value.slice(28));
            }
            curColumnClass = [...new Set([...curColumnClass, ...curCellClass])];
          }
          classAnnotation.push(curColumnClass);
        }
      }
    }
    // return classAnnotation;
    // console.log("Current class annotation is ");
    // if (pageName === "2009–10_Premier_League") {
    //   console.log("TableData is ");
    //   console.log(tempTable);
    //   console.log(classAnnotation);
    // }
    // console.log(classAnnotation);

    return Promise.resolve(classAnnotation);
  });
}

// This function returns a 2D array of objects representing the data for tableDataExplore.

// It taks two parameters:
//  1) HTML "selectedTableHTML" storing the HTML of a table
//  2) string "urlOrigin", storing which page this table is from

// It returns a 2D array of objects representing the data for tableDataExplore.
function setTableFromHTML(selecteTableHTML, urlOrigin) {
  let selectedTable = selecteTableHTML;
  let tempTable = [];

  // We first fetch the plain, unprocessed version of the table.
  // This is the part where we make the modification: use links instead of cell literals

  for (let i = 0; i < selectedTable.rows.length; ++i) {
    let tempRow = [];
    for (let j = 0; j < selectedTable.rows[i].cells.length; ++j) {
      let curCellText = HTMLCleanCell(selectedTable.rows[i].cells[j].innerText);
      // Note: We want to use the href as data (if such href exists) instead of its innerText.
      if (i > 0) {
        // We get all the links from this current cell (there may be more than one)
        let anchorArray = selectedTable.rows[i].cells[j].getElementsByTagName(
          "a"
        );
        // we want to use the first valid link as the search element for this cell
        // Definition of being valid: its associated innerText is not empty (thus not the link of a picture)
        //                            and it is not a citation (so [0] is not "[")
        for (let k = 0; k < anchorArray.length; ++k) {
          if (
            anchorArray[k].innerText !== "" &&
            anchorArray[k].innerText[0] !== "["
          ) {
            let hrefArray = anchorArray[k].href.split("/");
            // console.log("InnerText is "+anchorArray[k].innerText);
            // console.log("It exists in DBPedia as "+hrefArray[hrefArray.length-1]);
            curCellText = decodeURIComponent(hrefArray[hrefArray.length - 1]);
            // if (curCellText.includes("UEFA")) {
            // console.log(curCellText);
            // }
          }
        }
      }
      let curRowSpan = selectedTable.rows[i].cells[j].rowSpan;
      let curColSpan = selectedTable.rows[i].cells[j].colSpan;
      // console.log(curColSpan);
      tempRow.push({
        data: curCellText,
        origin: urlOrigin,
        rowSpan: curRowSpan,
        colSpan: curColSpan,
      });
    }
    tempTable.push(tempRow);
  }

  // We first deal with colspans.
  for (let i = 0; i < tempTable.length; ++i) {
    for (let j = 0; j < tempTable[i].length; ++j) {
      let curCellText = tempTable[i][j].data;
      if (tempTable[i][j].colSpan > 1) {
        for (let k = 1; k < tempTable[i][j].colSpan; ++k) {
          tempTable[i].splice(j + 1, 0, {
            data: curCellText,
            origin: urlOrigin,
            rowSpan: tempTable[i][j].rowSpan,
            colSpan: 1,
          });
        }
      }
    }
  }

  // We now deal with rowspans.
  for (let i = 0; i < tempTable.length; ++i) {
    for (let j = 0; j < tempTable[i].length; ++j) {
      let curCellText = tempTable[i][j].data;
      if (tempTable[i][j].rowSpan > 1) {
        for (let k = 1; k < tempTable[i][j].rowSpan; ++k) {
          // Note: the if condition is necessary to take care of error conditions (the original HTML table element has errors)
          if (i + k < tempTable.length) {
            tempTable[i + k].splice(j, 0, {
              data: curCellText,
              origin: urlOrigin,
              rowSpan: 1,
              colSpan: 1,
            });
          }
        }
      }
    }
  }

  // We now add in an additional column: the originURL of the page
  tempTable[0].splice(0, 0, {
    data: "OriginURL",
    origin: urlOrigin,
    rowSpan: 1,
    colSpan: 1,
  });
  for (let i = 1; i < tempTable.length; ++i) {
    tempTable[i].splice(0, 0, {
      data: urlOrigin,
      origin: "null",
      rowSpan: 1,
      colSpan: 1,
    });
  }
  return tempTable; // tempTable is a 2D array of objects storing the table data. Object has two fields: data(string) and origin(string).
}

// This function takes in 1 parameter
// 1) tableDataExplore, returned from setTableFromHTML.

// And returns tableData (with no header rows) that can be unioned with the selected table.

function setUnionData(tableDataExplore) {

  // We first need to set the tableHeader, so that cells have the correct origins
  let tableHeader = [];
  for (let j=0;j<tableDataExplore[0].length;++j) {
    tableHeader.push(
      {"value":tableDataExplore[0][j].data
      ,"label":tableDataExplore[0][j].data}
    )
  }
  // We then need to handle both data and origin.
  let tableData = [];
  // console.log(tableDataExplore);
  // This starts the loop for rows
  for (let i=1;i<tableDataExplore.length;++i) {
    let tempRow = [];
    // This starts the loop for columns
    for (let j=0;j<tableDataExplore[i].length;++j) {
      // First set the data
      let data = tableDataExplore[i][j].data;
      // Then set the origin
      let origin = [];
      let originText = tableDataExplore[i][j].origin+": "+tableHeader[j].value+": "+tableDataExplore[i][j].data;
      origin.push(originText);
      tempRow.push({"data":data,"origin":origin});
    }
    tableData.push(tempRow);
  }
  return tableData;
}

// This function takes in four parameters and return the CDF for hypergeometric distribution, for x
// N: total number of elements (780 in our case)
// K: total number of successful elements (length of selected column's class annotation)
// n: number of trials (length of test column's class annotation)
// x: (length of intersection of selected column and test column)

function hyperCDF(x, N, K, n) {
  let count = 0;
  // console.log(combinations(5,2));
  let denom = combinations(N, n);
  for (let i = 0; i <= x; ++i) {
    count += (combinations(K, i) * combinations(N - K, n - i)) / denom;
  }
  return count;
}

// This function renders this.props.tableData[i][j].data in a nicer way. 
// It changes"_" to " ", and removes everything after the first occurence of (

function niceRender(str) {
  let resultStr = str;
  let bracketIndex = str.indexOf("(");
  // If ( is present in a string, we want to remove it
  // We include the -1 because usually ( is preceeded by _
  if (bracketIndex !== -1) {
    resultStr = resultStr.slice(0, bracketIndex-1);
  }
  // now we turn all "_" into " "
  return resultStr.replace(/_/g, " ");
}

// This function takes in four parameters: 
// 1) resultsBinding: an array of JSON values representing entities satisfying the first column
// 2) tableData:      the tableData before update
// 3) tableHeader:    this.state.tableHeader
// 4) colIndex:       which column usersa are filling (usually 0)

// and returns the updated tableData, after updates have been made to the first column.

function setFirstColumnData(resultsBinding, tableData, tableHeader, colIndex) {
  // First we get the correct number of rows, which is equal to min(values[0].results.bindings.length, initialRowNum)
  let updatedRowCount = Math.min(resultsBinding.length, initialRowNum);
  // console.log("Original length is "+values[0].results.bindings.length);
  // console.log("Row Count is: "+updatedRowCount);

  // If tableData currently has too many rows, we slice it.
  if (tableData.length > updatedRowCount) {
    tableData = tableData.slice(0,updatedRowCount);
  }
  // Else, if tableData currently has too few rows, we need to add some empty rows.
  else if (tableData.length < updatedRowCount) {
    let rowsToAdd = updatedRowCount - tableData.length;
    for (let i = 0; i < rowsToAdd; ++i) {
      let tempRow = [];
      for (let j = 0; j < initialColNum; ++j) {
        tempRow.push({ data: "", origin: [] });
      }
      tableData.push(tempRow);
    }
  }

  let rowNum = tableData.length;
  // console.log("Number of rows is "+rowNum);

  // We do not want to overwrite entries that users have filled in.
  // Let's calculate how many entries we want to fill in.
  let emptyEntryCount = rowNum;
  for (let i = 0; i < rowNum; ++i) {
    if (tableData[i][colIndex].data !== "") {
      emptyEntryCount--;
    } else {
      break;
    }
  }
  // console.log("number of empty entries is "+emptyEntryCount);

  let startingIndex = rowNum - emptyEntryCount;
  // console.log("Starting index is"+startingIndex);

  for (let i = 0; i < emptyEntryCount; ++i) {
    tableData[i + startingIndex][colIndex].data = 
      resultsBinding[i].somevar.value.slice(28);
  }

  // second part sets the origin for each cell
  for (let i = 0; i < rowNum; ++i) {
    // We need to process the tableHeader[colIndex] array to get the correct text for origin
    let labelText = "";
    for (let j = 0; j < tableHeader[colIndex].length; ++j) {
      if (j > 0) {
        labelText += "&";
      }
      labelText += tableHeader[colIndex][j].value;
    }
    let tempOrigin = labelText + ":" + tableData[i][colIndex].data;
    tableData[i][colIndex].origin.push(tempOrigin);
  }

  // Now we dedup by tableData by tableData[i][0].data
  tableData = _.uniqBy(tableData, function(x) {return x[0].data;});
  return tableData;
}

// The following function takes in 2D array recording information of neighbours for the search column

// It return a desired oneD keyColNeighbours that we can give to selection Headers.

function processAllNeighbours(allNeighboursArray) {
  let keyColNeighbours = [];
  // console.log(allNeighboursArray);
  let allNeighboursArrayCopy = _.cloneDeep(allNeighboursArray);

  for (let i = 0; i < allNeighboursArrayCopy.length; ++i) {
    keyColNeighbours = keyColNeighbours.concat(allNeighboursArrayCopy[i]);
  }

  // Now we sort keyColNeighbours based on value
  keyColNeighbours.sort((a,b) => a.value < b.value ? -1 : 1);
  // console.log(keyColNeighbours);

  // Now, we run a loop to remove duplicates, and update count and filledCount
  if (keyColNeighbours.length > 0) {
    for (let i = 1; i < keyColNeighbours.length; ++i) {
      let prevEntry = keyColNeighbours[i-1];
      let curEntry = keyColNeighbours[i];

      // If the current entry's data is equal to the previous entry's data, we want to 
      // 1) delete curEntry
      // 2) (maybe) update prevEntry's count
      // 3) increment prevEntry's filledCount
      if (prevEntry.value === curEntry.value) {
        keyColNeighbours[i-1].filledCount = keyColNeighbours[i-1].filledCount + 1;
        keyColNeighbours[i-1].count = Math.max(prevEntry.count, curEntry.count);
        keyColNeighbours.splice(i,1);
        --i;
      }
    }
  }
  // Now we want to sort (and potentially filter) keyColNeighbours, by filledCount 
  keyColNeighbours.sort((a,b) => a.filledCount < b.filledCount ? 1 : -1);

  // Before we return, let's change the label to include filledCount
  for (let i = 0; i < keyColNeighbours.length; ++i) {
    let filledPercent = Math.round(keyColNeighbours[i].filledCount/allNeighboursArrayCopy.length * 100) / 100;
    keyColNeighbours[i].label = keyColNeighbours[i].label + " (" + filledPercent + ")";
  }

  // Take a look at keyColNeighbours
  // console.log(keyColNeighbours);

  return keyColNeighbours;
}

// The following function stores both predicate and object array for all entries in search column.
// Its return value is an array, length is tableData.length

function storeFirstDeg(neighbourArray) {
  // console.log(neighbourArray);
  let firstDegNeighbours = [];
  let neighbourArrayCopy = _.cloneDeep(neighbourArray);
  for (let i = 0; i < neighbourArrayCopy.length; ++i) {
    let tempObj = {};
    for (let j = 0; j < neighbourArrayCopy[i].length; ++j) {
      // The following line creates a deduped version of neighbourArrayCopy[i][j].data, since some bug seems to exist in DBpedia
      let dedupedData = _.uniq(neighbourArrayCopy[i][j].data.slice())
      tempObj[neighbourArrayCopy[i][j].value] = dedupedData;
      // console.log(neighbourArrayCopy[i][j].data.slice());
      // console.log(_.uniq(neighbourArrayCopy[i][j].data.slice()));
      // tempObj[neighbourArrayCopy[i][j].value] = neighbourArrayCopy[i][j].data;
    }
    firstDegNeighbours.push(tempObj);
  } 
  // console.log(firstDegNeighbours);
  return firstDegNeighbours;
}

// This function creates neighbourArrayText from neighbourArray

function createNeighbourText(neighbourArray) {
  let neighbourArrayText = "";
  for (let i = 0; i < neighbourArray.length; ++i) {
    if (i > 0) {
      neighbourArrayText+=" OR ";
    }
    let curNeighbourText = neighbourArray[i].type === "subject" ? neighbourArray[i].value : "is " + neighbourArray[i].value + " of";
    neighbourArrayText+=curNeighbourText;
  }
  return neighbourArrayText;
}

// This function add in the recommendNeighbours to objects in processedNeighbours.
// It takes in processedSubject(object)Neighbours, and returns the updated version.

// For each element from processedNeighbours, we want to add an attribute called recommendNeighbours
// recommendNeighbours is an array of objects with three attributes
// 1) value:        value of the recommend attribute
// 2) type:         type of the recommend attribute
// 3) relation:     how the recommend attribute is related to the original attribute: string, or semantic

function addRecommendNeighbours(processedNeighboursCopy) {
  // console.log(processedNeighbours);
  let processedNeighbours = _.cloneDeep(processedNeighboursCopy);

  // To do this, we need to a double loop over the processedNeighbours
  for (let i = 0; i < processedNeighbours.length; ++i) {

    // Initialize the recommendNeighbours array
    let recommendNeighbours = [];
    
    for (let j = 0; j < processedNeighbours.length; ++j) {
      // We only look at cases where i !== j
      if (i !== j) {
        // We consider three types of matching

        // 1st type is String Similarity: if X is a substring of Y, or Y is a substring of X 
        let upperStrOne = processedNeighbours[i].value.toUpperCase();
        let upperStrTwo = processedNeighbours[j].value.toUpperCase();
        if (upperStrOne.includes(upperStrTwo) || upperStrTwo.includes(upperStrOne)) {
          recommendNeighbours.push(
            {
              "value": processedNeighbours[j].value,
              "type": processedNeighbours[j].type,
              "relation": "string"
            }
          )
        }

        // 2nd type is semantic: if X and Y has the same range, or same subPropertyOf 
        if ((processedNeighbours[i].range === processedNeighbours[j].range && processedNeighbours[i].range !== "") ||
            (processedNeighbours[i].subPropertyOf === processedNeighbours[j].subPropertyOf && processedNeighbours[i].subPropertyOf !== "")) {
          recommendNeighbours.push(
            {
              "value": processedNeighbours[j].value,
              "type": processedNeighbours[j].type,
              "relation": "semantic"
            }
          )
        }
      }
    }
    // We take a look at the recommendNeighbours
    // console.log("Current neighbour is "+processedNeighbours[i].value);
    // if (recommendNeighbours.length > 0) {console.log(recommendNeighbours);}

    // Now, we create the recommendNeighbours attributes for the current element in processedNeighbours
    processedNeighbours[i]["recommendNeighbours"] = recommendNeighbours;
  }
  // console.log(processedNeighbours);
  return processedNeighbours;
}

// The following function creates the list of recommend attributes passed to the ActionPanel.

// It takes in one parameter: neighbourArray
// returns an array: recommendArray

function createRecommendArray(neighbourArray) {
  // We create the recommendArray variable using a simple rule:
  // It should be union of recommendNeighbours of all neighbours from neighbourArray, minus the neighbours from neighbourArray
  let recommendArray = [];

  // First we run a loop to take the union of recommendNeighbours
  for (let i = 0; i < neighbourArray.length; ++i) {
    recommendArray = recommendArray.concat(neighbourArray[i].recommendNeighbours);
  }
  // We then remove recommendations that are completely duplicated
  recommendArray = _.uniqBy(recommendArray, function(x) {
    return x.value || x.type || x.relation;
  });
  // We then remove recommendations that are already in neighbourArray
  recommendArray = _.differenceBy(recommendArray, neighbourArray, function(x) {
    return x.value || x.type;
  });
  // console.log(recommendArray);
  return recommendArray;
}

// The following function is a helper function for sorting used in updateFirstColSelection.

function getPCount(str, myArray) {
  let count = 0;
  for (let i = 0; i < myArray.length; ++i) {
    if (myArray[i].p.value === str) {
      ++count
    }
  }
  return count;
}

// The following function scans through a string, and changes all " " to "+"

function blankToPlus(str) {
  return str.replace(/\s/g, "+");
}

// The following function generates queryURL needed for Virtuoso, using information from neighbourArray (or tableHeader[0])

function keyQueryGen(neighbourArray) {

  // Following boolean is for error detection
  let error = false;

  // Following is a complete query.

  // select ?somevar
  // where {
  // ?somevar dct:subject dbc:Obama_family.
  // ?somevar dbp:district "13"^^<http://www.w3.org/2001/XMLSchema#integer>.
  // ?somevar dbo:birthPlace dbr:Hawaii.
  // ?somevar dbp:name "Barack Obama"^^<http://www.w3.org/1999/02/22-rdf-syntax-ns#langString>.
  // ?somevar dbo:activeYearsEndDate "2004-11-04"^^<http://www.w3.org/2001/XMLSchema#date>.
  // }

  let prefixURL = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
  let suffixURL = "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
  let queryBody = "select+%3Fsomevar%0D%0Awhere+%7B";
  for (let i = 0; i < neighbourArray.length; ++i) {
    // There are 5 cases that we have to deal with in total
    let textToAdd = ""
    // Case 1: dct (%0D%0A%3Fsomevar+dct%3Asubject+dbc%3AObama_family.)
    if (neighbourArray[i].pDataset === "dct") {
      textToAdd = 
        "%0D%0A%3Fsomevar+dct%3Asubject+dbc%3A" 
        + regexReplace(neighbourArray[i].oValue) 
        + ".";
    }
    // Case 2: oType is date (%0D%0A%3Fsomevar+dbo%3AactiveYearsEndDate+%222004-11-04%22%5E%5E%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23date%3E.)
    else if (neighbourArray[i].oType === "http://www.w3.org/2001/XMLSchema#date") {
      textToAdd = 
        "%0D%0A%3Fsomevar+" 
        + neighbourArray[i].pDataset
        + "%3A"
        + regexReplace(neighbourArray[i].pValue)
        + "+%22"
        + neighbourArray[i].oValue // Note no regexReplace here because it's in quotes
        + "%22%5E%5E%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23date%3E.";
    }
    // Case 3: oType is integer (%0D%0A%3Fsomevar+dbp%3Adistrict+%2213%22%5E%5E%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23integer%3E.)
    else if (neighbourArray[i].oType === "http://www.w3.org/2001/XMLSchema#integer") {
      textToAdd = 
        "%0D%0A%3Fsomevar+"
        + neighbourArray[i].pDataset
        + "%3A"
        + regexReplace(neighbourArray[i].pValue)
        + "+%22"
        + neighbourArray[i].oValue // Note no regexReplace here because it's in quotes
        + "%22%5E%5E%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23integer%3E.";
    }
    // Case 4: oType is string literal (%0D%0A%3Fsomevar+dbp%3Aname+%22Barack+Obama%22%5E%5E%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23langString%3E.)
    else if (neighbourArray[i].oType === "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString") {
      textToAdd = 
        "%0D%0A%3Fsomevar+"
        + neighbourArray[i].pDataset
        + "%3A"
        + regexReplace(neighbourArray[i].pValue)
        + "+%22"
        + blankToPlus(neighbourArray[i].oValue) // Note no regexReplace here, but blankToPlus is needed
        + "%22%5E%5E%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23langString%3E.";
    }
    // Case 5: oType is nonnegative integer
    else if (neighbourArray[i].oType === "http://www.w3.org/2001/XMLSchema#nonNegativeInteger") {
      textToAdd = 
        "%0D%0A%3Fsomevar+"
        + neighbourArray[i].pDataset
        + "%3A"
        + regexReplace(neighbourArray[i].pValue)
        + "+%22"
        + neighbourArray[i].oValue // Note no regexReplace here because it's in quotes
        + "%22%5E%5E%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23nonNegativeInteger%3E.";
    }
    // Case 6: oType is "", in this case the object value is some dbr
    else if (neighbourArray[i].oType === "") {
      textToAdd = 
        "%0D%0A%3Fsomevar+"
        + neighbourArray[i].pDataset
        + "%3A"
        + regexReplace(neighbourArray[i].pValue)
        + "+dbr%3A"
        + regexReplace(neighbourArray[i].oValue)
        + ".";
    }
    // Otherwise, we have run into some error potentially
    else {
      console.log(neighbourArray[i].oType);
      error = true;
    }
    queryBody+=textToAdd;
  }
  // Finally we add in the last bit of text to queryBody
  queryBody+="%0D%0A%7D%0D%0A&";

  // Create the queryURL and take a look
  let queryURL = prefixURL + queryBody + suffixURL;
  
  // We now return. If error is true, we return error, else, we return queryURL
  if (error === true) {
    return "ERROR";
  }
  else {
    return queryURL;
  }
}

