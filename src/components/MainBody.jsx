// import { Route, Switch, Link } from "react-router-dom";
import React, { Component } from "react";
import { combinations } from "mathjs";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SettingModal from "../components/SettingModal";
import LandingPage from "../components/LandingPage";
import TablePanel from "../components/TablePanel";
import ActionPanel from "../components/ActionPanel";
import PagePanel from "../components/PagePanel";
import _ from "lodash";

const maxNeighbourCount = 50;
const initialColNum = 4;
const initialRowNum = 50;

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
      tableHeader.push("");
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
      showModal: false,    // boolean storing whether setting modal is shown or not. Default to false.
      showTableSelection: false,    // boolean storing whether the list of tables from page is shown. Default to false.
      tabIndex: 1,         // integer storing the index of the tab currently displaying. Default to 1.

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

      // startes below are useful for startTable
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
    this.populateKeyColumn = this.populateKeyColumn.bind(this);
    this.getOtherColPromise = this.getOtherColPromise.bind(this);
    // this.getOtherColPromiseTwo = this.getOtherColPromiseTwo.bind(this);
    this.populateOtherColumn = this.populateOtherColumn.bind(this);
    this.addAllNeighbour = this.addAllNeighbour.bind(this);
    this.sameNeighbourDiffCol = this.sameNeighbourDiffCol.bind(this);
    this.sameNeighbourOneCol = this.sameNeighbourOneCol.bind(this);
    this.populateSameRange = this.populateSameRange.bind(this);
    this.contextAddColumn = this.contextAddColumn.bind(this);
    this.contextSetCell = this.contextSetCell.bind(this);
    this.contextCellOrigin = this.contextCellOrigin.bind(this);

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
  }

  handleURLPaste(urlPasted) {
    // As soon as the URL has been pasted, we want to fetch all tables from the pasted URL.
    // We then update the originTableArray, which stores all the tables found on the pasted URL
    // We also initialize tableOpenList to all false

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
          let curText = tableData[i][j].data;
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
      // Since the starting task is"startSubject", we set the URL to be the first cell in the table
      const subject = decodeURIComponent(this.state.urlPasted.slice(30)); // add a decodeURIComponent here
      let tableData = _.cloneDeep(this.state.tableData);
      tableData[0][0].data = subject;

      // Adding support for undo:
      let lastAction = "handleStartSubject";
      let prevState = 
        {
          "usecaseSelected":this.state.usecaseSelected,
          "tableData":this.state.tableData,
          "tabIndex":this.state.tabIndex,
        };

      this.setState({
        usecaseSelected: taskSelected,
        tableData: tableData,
        lastAction: lastAction,
        prevState: prevState,
        tabIndex: 0,
      });
    } 
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

      let prefixURL =
        "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
      let queryBody = "SELECT+%3Fsomevar%0D%0AWHERE+%7B";
      for (let i = 0; i < allSubject.length; ++i) {
        queryBody +=
          "%0D%0A++++++++dbr%3A" + allSubject[i] + "+dct%3Asubject+%3Fsomevar.";
      }
      let suffixURL =
        "%0D%0A%7D%0D%0A&format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
      let queryURL = prefixURL + queryBody + suffixURL;
      let promiseArray = [];
      promiseArray.push(fetchJSON(queryURL));
      allPromiseReady(promiseArray).then((values) => {
        let myJson = values[0];
        let keyColOptions = [];
        for (let i = 0; i < myJson.results.bindings.length; ++i) {
          let tempObj = {};
          let neighbour = myJson.results.bindings[i].somevar.value.slice(37);
          tempObj["label"] = neighbour;
          tempObj["value"] = neighbour;
          keyColOptions.push(tempObj);
        }
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

  getOtherOptions(e, colIndex) {
    if (colIndex !== this.state.keyColIndex) {
      // first we want to check if this column is all-empty
      let colEmpty = true;
      let nonEmptyInfo = [];
      for (let i = 0; i < this.state.tableData.length; ++i) {
        if (this.state.tableData[i][colIndex].data !== "") {
          colEmpty = false;
          nonEmptyInfo.push([i, this.state.tableData[i][colIndex].data]);
        }
      }
      // We only want to update the options if the column is non-empty
      // Make sure to modify this relation here to include only dbo and dbp
      if (colEmpty === false) {
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
      // If this non-key column is empty, we just use keyColNeighbours for the list of options
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
    // console.log("Check table header here");
    // console.log(this.state.tableHeader);
    //  We first create a copy of the existing table headers
    let tableHeader = this.state.tableHeader.slice();

    // This part deals with the selection of key column header
    if (colIndex === this.state.keyColIndex) {
      // We create a copy of the selected option
      if (e !== null) {
        let selectedOptions = e.slice();
        // console.log(selectedOptions);
        tableHeader[colIndex] = selectedOptions;
        let tempObj = {};
        tempObj["task"] = "populateKeyColumn";
        tempObj["colIndex"] = colIndex;
        tempObj["neighbourArray"] = [];
        for (let i = 0; i < selectedOptions.length; ++i) {
          tempObj.neighbourArray.push(selectedOptions[i].value);
        }
        this.setState({
          tableHeader: tableHeader,
          curActionInfo: tempObj,
        });
      }
    }
    // This part deals with the selection of non key column header
    else {
      // The first few lines fix some pass by reference problems
      let evalue = e.value;
      let elabel = e.label;
      tableHeader[colIndex] = { value: evalue, label: elabel };
      // We want to change the label of non-key column headers with respect to the label of key column
      // We first create the label text for the key column
      let keyColLabel = "";
      if (this.state.keyColIndex === 0) {
        for (let i = 0; i < tableHeader[this.state.keyColIndex].length; ++i) {
          if (i > 0) {
            keyColLabel += "&";
          }
          keyColLabel += tableHeader[this.state.keyColIndex][i].label;
        }
      } else {
        keyColLabel = tableHeader[this.state.keyColIndex].label;
      }
      // Bugfix for Go Table Creation: if at this stage, keyColLable is still "", that means we came from the tabel union task first.
      // In this case, tableHeader[keyColIndex] is an object, not an array. 
      // So we just set keyColLabel as tableHeader[this.state.keyColIndex].label
      if (keyColLabel === "") {
        keyColLabel = tableHeader[this.state.keyColIndex].label;
      }
      // We then append the current column's label to it
      // console.log(keyColLabel);
      tableHeader[colIndex].label =
        tableHeader[colIndex].label + "--" + keyColLabel;
      // After we have selected the column header, not only do we want to fill in the name of the column, we also want to
      // ask in ActionPanel whether user wants to populate the column based on the chosen column name
      let tempObj = {};
      tempObj["task"] = "populateOtherColumn";
      tempObj["colIndex"] = colIndex;
      tempObj["neighbour"] = e.value;
      tempObj["type"] = e.type;
      // We want to deal with duplicate neighbour names since we are selecting column headers for non-key columns
      let arr = elabel.split("-");
      if (arr.length > 1 && !isNaN(Number(arr[1]) - 1)) {
        // arr[1] stores the index of the neighbour with duplicate names
        tempObj["neighbourIndex"] = Number(arr[1]) - 1;
      } else {
        // If neighbourIndex is equal to -1, that means this property has no duplicate names
        tempObj["neighbourIndex"] = -1;
      }

      // If type is subject, let's check if this neighbour also has a "range" (rdfs:range)
      if (e.type === "subject" && e.range !== undefined) {
        tempObj["range"] = e.range;
      }
      // console.log(tempObj);

      this.setState({
        tableHeader: tableHeader,
        curActionInfo: tempObj,
      });
    }
  }

  // This function populates the key column
  // It also fetches the neighbours of the key column (based on the first cell in the table)
  // as well as setting the origins of cells in the key column

  // Note: we need to do some modification here. Instead of having a fixed number of entries in the key column,
  // Let's make it more flexible. (but also pose a limit, so we don't get way too many entries)

  populateKeyColumn(e, colIndex, neighbour) {
    // We will populate this column based on query: ?p dct:subject dbc:Presidents_of_United_States
    // We also need to fetch the neighbours of this key column, both using the key column entries as subject and object

    // Since we need to make multiple (three) queries, we make a promise array
    let promiseArray = [];

    // Below is the first query we will make.
    // This query populates the first columns.
    // Note: since neighbour is now an array instead of a single value (as we are allowing multiselects), we need to adjust our query
    // let prefixURLOne = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    // let suffixURLOne = "%0D%0A%0D%0A&format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    // let queryBodyOne = "SELECT+%3Fsomevar+%0D%0AWHERE+%7B%0D%0A%09%3Fsomevar+dct%3Asubject+dbc%3A"
    //                     +regexReplace(neighbour)
    //                     +".%0D%0A%7D%0D%0ALIMIT+"+emptyEntryCount;
    let prefixURLOne =
      "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    // let suffixURLOne =
    //   "%0D%0A%7D+%0D%0Alimit+" +
    //   emptyEntryCount +
    //   "&format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    let suffixURLOne =
      "%0D%0A%7D+%0D%0A" +
      "&format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    let queryBodyOne = "select+%3Fsomevar%0D%0Awhere+%7B";
    // We are using a loop here because multi-select is possible
    for (let i = 0; i < neighbour.length; ++i) {
      queryBodyOne =
        queryBodyOne +
        "%0D%0A+++++++%3Fsomevar+dct%3Asubject+dbc%3A" +
        regexReplace(neighbour[i]) +
        ".";
    }
    let queryURLOne = prefixURLOne + queryBodyOne + suffixURLOne;
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

    // Let's modify the query below to support the "populate from same range feature"

    // let prefixURLTwo = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    // let suffixURLTwo = "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    // let queryBodyTwo =
    //   "SELECT+%3Fp+%0D%0AWHERE+%7B%0D%0A++++++++dbr%3A"
    //   +regexReplace(this.state.tableData[0][colIndex].data)
    //   +"+%3Fp+%3Fo.%0D%0A++++++++BIND%28STR%28%3Fp%29+AS+%3FpString+%29.%0D%0A++++++++FILTER%28%0D%0A+++++++++++++++%21%28regex%28%3FpString%2C%22abstract%7CwikiPage%7Calign%7Ccaption%7Cimage%7Cwidth%7Cthumbnail%7Cblank%22%2C%22i%22%29%29+%0D%0A+++++++++++++++%26%26+regex%28%3FpString%2C+%22ontology%7Cproperty%22%2C+%22i%22%29%0D%0A+++++++++++++++%29%0D%0A%7D%0D%0A%0D%0A&";
    let prefixURLTwo =
      "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    let suffixURLTwo =
      "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    let queryBodyTwo =
      "SELECT+%3Fp+%3Frange%0D%0AWHERE+%7B%0D%0A+++++++dbr%3A" +
      regexReplace(this.state.tableData[0][colIndex].data) +
      "+%3Fp+%3Fo.%0D%0A+++++++OPTIONAL+%7B%3Fp+rdfs%3Arange+%3Frange%7D.%0D%0A+++++++BIND%28STR%28%3Fp%29+AS+%3FpString+%29.%0D%0A+++++++FILTER%28%0D%0A++++++++++++++%21%28regex%28%3FpString%2C%22abstract%7CwikiPage%7Calign%7Ccaption%7Cimage%7Cwidth%7Cthumbnail%7Cblank%22%2C%22i%22%29%29+%0D%0A++++++++++++++%26%26+regex%28%3FpString%2C+%22ontology%7Cproperty%22%2C+%22i%22%29%0D%0A++++++++++++++%29%0D%0A%7D&";
    let queryURLTwo = prefixURLTwo + queryBodyTwo + suffixURLTwo;
    let otherColPromiseSubject = fetchJSON(queryURLTwo);
    promiseArray.push(otherColPromiseSubject);

    // Below is the third query we will make.
    // Difference with the previous query is that we are using tableData[0][colIndex] as OBJECT
    let prefixURLThree =
      "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    let suffixURLThree =
      "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    let queryBodyThree =
      "SELECT+%3Fp+%0D%0AWHERE+%7B%0D%0A++++++++%3Fs+%3Fp+dbr%3A" +
      regexReplace(this.state.tableData[0][colIndex].data) +
      ".%0D%0A++++++++BIND%28STR%28%3Fp%29+AS+%3FpString+%29.%0D%0A++++++++FILTER%28%0D%0A+++++++++++++++%21%28regex%28%3FpString%2C%22abstract%7CwikiPage%7Calign%7Ccaption%7Cimage%7Cwidth%7Cthumbnail%7Cblank%22%2C%22i%22%29%29+%0D%0A+++++++++++++++%26%26+regex%28%3FpString%2C+%22ontology%7Cproperty%22%2C+%22i%22%29%0D%0A+++++++++++++++%29%0D%0A%7D%0D%0A&";
    let queryURLThree = prefixURLThree + queryBodyThree + suffixURLThree;
    let otherColPromiseObject = fetchJSON(queryURLThree);
    promiseArray.push(otherColPromiseObject);

    allPromiseReady(promiseArray).then((values) => {
      // let's first work with the first promise result: fill in table data with the entities we have fetched

      // This part sets the data for each cell
      let tableData = _.cloneDeep(this.state.tableData);

      // First we get the correct number of rows, which is equal to min(values[0].results.bindings.length, initialRowNum)
      let updatedRowCount = Math.min(values[0].results.bindings.length, initialRowNum);
      // console.log("Original length is "+values[0].results.bindings.length);
      // console.log("Row Count is: "+updatedRowCount);

      // If tableData has too many rows, we slice it. Else we keep it the same way.
      if (tableData.length > updatedRowCount) {
        tableData = tableData.slice(0,updatedRowCount);
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

      for (let i = 0; i < emptyEntryCount; ++i) {
        tableData[i + startingIndex][colIndex].data = 
          values[0].results.bindings[i].somevar.value.slice(28);
      }

      // second part sets the origin for each cell
      for (let i = 0; i < rowNum; ++i) {
        // We need to process the tableHeader[colIndex] array to get the correct text for origin
        let labelText = "";
        for (let j = 0; j < this.state.tableHeader[colIndex].length; ++j) {
          if (j > 0) {
            labelText += "&";
          }
          labelText += this.state.tableHeader[colIndex][j].value;
        }
        let tempOrigin = labelText + ":" + tableData[i][colIndex].data;
        tableData[i][colIndex].origin.push(tempOrigin);
      }

      // let's now work with the second and third promise result: update the selection options for non-key columns

      let keyColNeighbours = [];
      keyColNeighbours = updateKeyColNeighbours(
        keyColNeighbours,
        values[1].results.bindings,
        "subject"
      );
      keyColNeighbours = updateKeyColNeighbours(
        keyColNeighbours,
        values[2].results.bindings,
        "object"
      );
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
          "curActionInfo":this.state.curActionInfo,
          "tableData":this.state.tableData,
          "optionsMap":this.state.optionsMap
        };


      this.setState({
        keyColIndex: colIndex,
        keyColNeighbours: keyColNeighbours,
        curActionInfo: null,
        tableData: tableData,
        optionsMap: optionsMap,
        lastAction: lastAction,
        prevState: prevState,
      });
    });
  }

  // TEST FUNCTION----------------------------------------------------

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
  // It makes an array of querie, which may affect the performance of our system. Let's change it now.

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

  populateOtherColumn(e, colIndex, neighbour, neighbourIndex, type, range) {

    // Support for "populateSameRange":

    // When the range is not equal to undefined, we want to ask user if they want to populate all other attributes from this range
    // console.log(range);

    // we need to make a number of queries in the form of: dbr:somekeycolumnentry dbp:neighbour|dbo:neighbour somevar
    // let promiseArrayTwo = this.getOtherColPromiseTwo(neighbour, type); // this is for testing
    let promiseArray = this.getOtherColPromise(neighbour, type);

    allPromiseReady(promiseArray).then((values) => {
    // allPromiseReady(promiseArrayTwo).then((testValues) => {

      // // Now we need to process the testValues

      // let pairArray = [];

      // // First we removed the prefixes from resultArray
      // for (let i=0; i<testValues[0].results.bindings.length; ++i) {
      //   pairArray.push(
      //     {
      //       "key":removePrefix(testValues[0].results.bindings[i].key.value),
      //       "value":removePrefix(testValues[0].results.bindings[i].val.value)
      //     }
      //   )
      // }
      // console.log(pairArray);

      // // Then we create a keyArray
      // let keyArray = [];

      // for (let i=0; i<this.state.tableData.length; ++i) {
      //   keyArray.push(this.state.tableData[i][this.state.keyColIndex].data);
      // }
      // console.log(keyArray);

      let tableData = _.cloneDeep(this.state.tableData);
      let requiredLength = neighbourIndex === -1 ? 1 : neighbourIndex + 1;
      for (let i = 0; i < values.length; ++i) {
        if (values[i].results.bindings.length < requiredLength) {
          // this means results is not found
          // or if there is not enough results, in duplicate neighbour name case
          if (tableData[i][this.state.keyColIndex].data === "") {
            tableData[i][colIndex].data = "";
          } else {
            tableData[i][colIndex].data = "N/A";
          }
        } else {
          // let's determine if we need to truncate
          // Note: In here we are fetching the first value from the binding array. But sometimes there will be more than 1.
          // Think about what to do when there are duplicates
          // console.log("Current value is ");
          // console.log(values[])
          let dbResult =
            values[i].results.bindings[requiredLength - 1].somevar.value;
          dbResult = removePrefix(dbResult);
          // We first set the data of the cell
          tableData[i][colIndex].data = dbResult;
          // We then set the origin of the cell
          // This origin depends on whether type is "subject" or "object"
          let originToAdd;
          // console.log(type);
          if (type === "subject") {
            originToAdd = neighbour + ":" + dbResult;
          } else {
            originToAdd = "is " + neighbour + " of:" + dbResult;
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

      // Note: the index we use in the values array has to be this.state.keyEntryIndex, because that one is the entry currently in effect
      let maxCount = Math.min(
        values[this.state.keyEntryIndex].results.bindings.length,
        maxNeighbourCount
      );
      // console.log("neighbour index is "+neighbourIndex);
      // console.log("max count is "+maxCount);
      let remainNeighbourCount = maxCount - neighbourIndex - 1;
      // console.log("remain neighbour count is "+remainNeighbourCount);
      let tempObj = {};
      if (neighbourIndex !== -1 && remainNeighbourCount > 0) {
        tempObj["task"] = "populateSameNeighbour";
        tempObj["colIndex"] = colIndex;
        tempObj["neighbour"] = neighbour;
        tempObj["neighbourIndex"] = neighbourIndex;
        tempObj["type"] = type;
        tempObj["numCols"] = remainNeighbourCount;
        // Note that if we populateSameNeighbour in different columns, we may also need this range attribute
        if (range !== undefined) {
          tempObj["range"] = range;
        }
      } 
      // If we are not populating a column with duplicate names, but it has a range, we ask user if they want to populate
      // other columns from the same range
      else if (range !== undefined) {
        let siblingNeighbour = [];
        // console.log("Range is "+range);
        // console.log(this.state.keyColNeighbours);
        for (let i = 0; i < this.state.keyColNeighbours.length; ++i) {
          if (
            this.state.keyColNeighbours[i].range === range &&
            this.state.keyColNeighbours[i].value !== neighbour
          ) {
            siblingNeighbour.push(this.state.keyColNeighbours[i].value);
          }
        }
        // If we have found columns from the same range (other than the current neighbour),
        // we give user the option to populate other columns from the same range.
        if (siblingNeighbour.length > 0) {
          // First, we want to keep track of the number of occurences for each sibling attribute
          let siblingUnique = [...new Set(siblingNeighbour)];
          let siblingCount = [];
          for (let i = 0; i < siblingUnique.length; ++i) {
            // console.log(siblingNeighbour);
            siblingCount.push({
              name: siblingUnique[i],
              count: siblingNeighbour.filter((x) => x === siblingUnique[i])
                .length,
            });
          }
          // console.log(siblingCount);
          // Let's do some string processing to improve UI clarity
          let rangeLiteral = "";
          if (range.includes("http://dbpedia.org/ontology/")) {
            rangeLiteral = range.slice(28);
          } else if (range.includes("http://www.w3.org/2001/XMLSchema#")) {
            rangeLiteral = range.slice(33);
          } else {
            rangeLiteral = range;
          }
          tempObj["task"] = "populateSameRange";
          tempObj["colIndex"] = colIndex;
          tempObj["range"] = rangeLiteral;
          tempObj["siblingNeighbour"] = siblingCount;
        }
      }
      // This is an empty else clause
      else {
      }
      // console.log(tempObj);

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
    });
    // });
  }

  // This function is a helper function that takes in 10 parameters:
  // Note: this function does not make any fetch requests, thus does NOT involve promises.

  // 1) colIndex:        index of the column that we just filled     (ex. 1, if we just filled in column 1)
  // 2) neighbour:       attribute name of the column we just filled (ex. almaMater)
  // 3) neighbourIndex:  index of the attribute we just filled       (ex. 0, if we have filled in almaMater-1)
  // 4) type:            type of the attribute. Either "subject" or "object"
  // 5) numCols:         number of columns that we need to fill with the duplicated neighbour. (ex. 2, if we have filled in one almaMater, but there are three in total)
  // 6) values:          query results that are passed in

  // 7) tableHeader:                 original tableHeader
  // 8) tableData:                   original tableData
  // 9) optionsMap:                  original optionsMap
  // 10) selectedClassAnnotation:    original selectedClassAnnotation

  // and returns an object with 5 values:
  // 1) tableHeader:                tableHeader after modification
  // 2) tableData:                  tableData after modification
  // 3) optionsMap:                 optionsMap after modification
  // 4) selectedClassAnnotation:    selectedClassAnnotation after modification
  // 5) keyColIndex:                keyColIndex after modification

  addAllNeighbour(
    colIndex,
    neighbour,
    neighbourIndex,
    type,
    numCols,
    values,
    tableHeader,
    tableData,
    optionsMap,
    selectedClassAnnotation,
    keyColIndex,
  ) {
    // Let's first check if all the variables are as expected

    // console.log("Column index is: "+colIndex);
    // console.log("Neighbour is: "+neighbour);
    // console.log("Neighbour index is: "+neighbourIndex);
    // console.log("Type is: "+type);
    // console.log("Number of columns to fill is: "+numCols);
    // console.log("Table header is: ");
    // console.log(tableHeader);
    // console.log("Table Data is: ");
    // console.log(tableData);
    // console.log("Options map is: ");
    // console.log(optionsMap);
    // console.log(values);

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

    // we now take care of table header's addition.
    let tableHeaderUpdated = [];
    for (let j = 0; j < colIndex + 1; ++j) {
      tableHeaderUpdated.push(tableHeader[j]);
    }
    // some modification needs to be made here
    let labelText = "";
    if (keyColIndex === 0) {
      for (
        let i = 0;
        i < tableHeader[0].length;
        ++i
      ) {
        if (i > 0) {
          labelText += "&";
        }
        labelText += tableHeader[0][i].value;
      }
    } else {
      // there's a bug somewhere here. Needs to fix it later.
      labelText = tableHeader[keyColIndex].label;
    }
    for (let j = 0; j < numCols; ++j) {
      let curLabel = "";
      // First case is for type "subject"
      if (type === "subject") {
        curLabel =
          curLabel +
          neighbour +
          "-" +
          (neighbourIndex + 2 + j) +
          "--" +
          labelText;
      }
      // Second case is for type "object"
      else {
        curLabel =
          curLabel +
          "is " +
          neighbour +
          " of-" +
          (neighbourIndex + 2 + j) +
          "--" +
          labelText;
      }
      tableHeaderUpdated.push({ value: neighbour, label: curLabel });
    }
    for (let k = colIndex + 1; k < colNum; ++k) {
      tableHeaderUpdated.push(tableHeader[k]);
    }

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

    // Finally, we fill in the actual data for tableData. We need to take care of both data and origin
    // for (let i=0;i<values.length;++i) {
    //   console.log(values[i].results.bindings);
    // }
    for (let curCol = colIndex + 1; curCol < colIndex + 1 + numCols; ++curCol) {
      // curNeighbourIndex represents the required length
      let requiredLength = neighbourIndex + curCol - colIndex + 1;
      for (let i = 0; i < values.length; ++i) {
        // Firt case: result is not found, or there is not enough results (in duplicate neighbour case)
        // console.log(values[i]);
        if (values[i].results.bindings.length < requiredLength) {
          tableDataUpdated[i][curCol].data = "N/A";
        }
        // Second case: result is found. We need to process them.
        else {
          // let's determine if we need to truncate
          // Note: In here we are fetching the first value from the binding array. But sometimes there will be more than 1.
          // Think about what to do when there are duplicates
          let dbResult =
            values[i].results.bindings[requiredLength - 1].somevar.value;
          dbResult = removePrefix(dbResult);
          // We first set the data of the cell
          tableDataUpdated[i][curCol].data = dbResult;
          // We then set the origin of the cell
          // This origin depends on whether type is "subject" or "object"
          let originToAdd;
          // console.log(type);
          if (type === "subject") {
            originToAdd = neighbour + ":" + dbResult;
          } else {
            originToAdd = "is " + neighbour + " of:" + dbResult;
          }
          // console.log(originToAdd);
          let keyOrigin = tableDataUpdated[i][
            keyColIndexUpdated
          ].origin.slice();
          // console.log(keyOrigin);
          keyOrigin.push(originToAdd);
          // console.log(keyOrigin);
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

  sameNeighbourDiffCol(e,colIndex,neighbour,neighbourIndex,type,numCols,range) {

    // The following is testing for 2D Promise arrays. Turns out it works!
    // let promiseArrayOne = this.getOtherColPromise(neighbour,type);
    // let promiseArrayTwo = this.getOtherColPromise(neighbour,type);
    // let twoD = [promiseArrayOne,promiseArrayTwo];
    // allPromiseReady(twoD).then((values) => {
    //   console.log(values);
    // })

    // console.log(neighbourIndex);
    // console.log(range);

    let promiseArray = this.getOtherColPromise(neighbour,type);
    allPromiseReady(promiseArray).then((values) => {
      let newState = this.addAllNeighbour(colIndex,
                                        neighbour,
                                        neighbourIndex,
                                        type,
                                        numCols,
                                        values,
                                        this.state.tableHeader,
                                        this.state.tableData,
                                        this.state.optionsMap,
                                        this.state.selectedClassAnnotation,
                                        this.state.keyColIndex);
      // Let's also create the object we need for populateSameRange
      // Note: the following code is identical to what we have in populateOtherColumn
      let tempObj = {};
      let siblingNeighbour = [];
      // console.log("Range is "+range);
      // console.log(this.state.keyColNeighbours);
      for (let i=0;i<this.state.keyColNeighbours.length;++i) {
        if (range !== undefined
            &&this.state.keyColNeighbours[i].range === range 
            && this.state.keyColNeighbours[i].value !== neighbour) {
          siblingNeighbour.push(this.state.keyColNeighbours[i].value);
        }
      }
      // If we have found columns from the same range (other than the current neighbour), 
      // we give user the option to populate other columns from the same range.
      if (siblingNeighbour.length > 0) {
        // This needs some additional checking to prevent bugs
        // console.log("We may have a bug here");
        // console.log("Range is: "+range);
        // console.log("SiblingNeighbour is "+siblingNeighbour);
        // console.log("Is undefined equal to undefined? "+(undefined === undefined));
        // First, we want to keep track of the number of occurences for each sibling attribute
        let siblingUnique = [...new Set(siblingNeighbour)];
        let siblingCount = [];
        for (let i=0;i<siblingUnique.length;++i) {
          // console.log(siblingNeighbour);
          siblingCount.push({"name":siblingUnique[i],"count":siblingNeighbour.filter(x => x === siblingUnique[i]).length})
        }
        // console.log(siblingCount);
        // Let's do some string processing to improve UI clarity
        let rangeLiteral = "";
        if (range.includes("http://dbpedia.org/ontology/")) {
          rangeLiteral = range.slice(28);
        } 
        else if (range.includes("http://www.w3.org/2001/XMLSchema#")) {
          rangeLiteral = range.slice(33);
        } 
        else {
          rangeLiteral = range;
        }
        tempObj["task"] = "populateSameRange";
        tempObj["colIndex"] = colIndex+numCols;  // Small change here: we need to adjust the position of the column index
        tempObj["range"] = rangeLiteral;
        tempObj["siblingNeighbour"] = siblingCount;
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
    })
  }

  // This function populates all neighbour with the same names in the same columns, if that neighbour has multiple occurences.

  sameNeighbourOneCol(e, colIndex, neighbour, neighbourIndex, type, numCols) {
    // console.log(colIndex);
    // console.log(neighbour);
    // console.log(neighbourIndex);
    // console.log(type);
    // console.log(numCols);

    // In this option, we just need to change data in column "ColIndex", by putting "numCols" numbers of new values into it
    let tableData = _.cloneDeep(this.state.tableData);
    let promiseArray = this.getOtherColPromise(neighbour, type);
    allPromiseReady(promiseArray).then((values) => {
      for (
        let requiredLength = neighbourIndex + 2;
        requiredLength < neighbourIndex + numCols + 2;
        ++requiredLength
      ) {
        for (let i = 0; i < values.length; ++i) {
          if (values[i].results.bindings.length >= requiredLength) {
            let dbResult =
              values[i].results.bindings[requiredLength - 1].somevar.value;
            dbResult = removePrefix(dbResult);
            tableData[i][colIndex].data =
              tableData[i][colIndex].data + ";" + dbResult;
            let updatedOrigin = tableData[i][colIndex].origin.slice();
            updatedOrigin[updatedOrigin.length - 1] =
              updatedOrigin[updatedOrigin.length - 1] + ";" + dbResult;
            tableData[i][colIndex].origin = updatedOrigin;
          }
        }
      }

      // Support for undo: 
      let lastAction = "sameNeighbourOneCol";
      let prevState = 
        {
          "curActionInfo":this.state.curActionInfo,
          "tableData":this.state.tableData,
        };

      this.setState({
        curActionInfo: null,
        tableData: tableData,
        lastAction: lastAction,
        prevState: prevState,
      });
    });
  }

  // The following function populates all neighbour from the same range (ex. all neighbours with rdfs:range Person)
  // This function should use addAllNeighbour as a helper function
  populateSameRange(e, colIndex, range, siblingNeighbour) {

    // console.log("Column index is "+colIndex);
    // console.log("Range is "+range);
    // console.log("Sibling neighbours are: ");
    // console.log(siblingNeighbour);
    // for (let i=0;i<siblingNeighbour.length;++i) {
    //   console.log("Neighbour name is: "+siblingNeighbour[i].name);
    //   console.log("Count is: "+siblingNeighbour[i].count);
    // }
    let promiseArrayTwoD = [];
    for (let i=0;i<siblingNeighbour.length;++i) {
      let curPromiseArray = this.getOtherColPromise(siblingNeighbour[i].name,"subject");
      for (let j=0;j<curPromiseArray.length;++j) {
        promiseArrayTwoD.push(curPromiseArray[j]);
      }
      // promiseArrayTwoD.push(this.getOtherColPromise(siblingNeighbour[i].name,"subject"));
    } 
    allPromiseReady(promiseArrayTwoD).then((values) => {

      // for (let i=0;i<values.length;++i) {
      //   console.log(values[i]);
      // }

      // first we fetch the initial state of tableHeader, tableData, optionsMap, and selectedClassAnnotation
      let tempHeader = this.state.tableHeader;
      let tempData = this.state.tableData;
      let tempOptions = this.state.optionsMap;
      let tempAnnotation = this.state.selectedClassAnnotation;
      let tempKeyColIndex = this.state.keyColIndex;
      let curColIndex = colIndex;
      for (let i=0;i<siblingNeighbour.length;++i) {
        let curValueArray = [];
        for (let j=0;j<tempData.length;++j) {
          curValueArray.push(values[tempData.length*i+j]) // since working with 2D promise array is not figured out yet, we need to manipulate index
        }
        let newState = this.addAllNeighbour(curColIndex,
                                            siblingNeighbour[i].name,    // this is name of the neighbour
                                            -1,                          // this is neighbour index. -1 indicates that we have not populated any neighbour of this name
                                            "subject",                   // for now, type can only be subject
                                            siblingNeighbour[i].count,   // we need to populate this number of columns for this neighbour
                                            curValueArray,               // This is the fetched data
                                            tempHeader,
                                            tempData,
                                            tempOptions,
                                            tempAnnotation,
                                            tempKeyColIndex);
        curColIndex+=siblingNeighbour[i].count;
        tempHeader = newState.tableHeader;
        tempData = newState.tableData;
        tempOptions = newState.optionsMap;
        tempAnnotation = newState.selectedClassAnnotation;
        tempKeyColIndex = newState.keyColIndex;
      }

      // Support for undo: 
      let lastAction = "populateSameRange";
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
        curActionInfo:null,
        tableData:tempData,
        tableHeader:tempHeader,
        optionsMap:tempOptions,
        selectedClassAnnotation:tempAnnotation,
        keyColIndex:tempKeyColIndex,
        lastAction:lastAction,
        prevState:prevState,
      })
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
    this.setState({
      tableData: tableData,
      tableHeader: tableHeader,
      curActionInfo: null,
      optionsMap: optionsMap,
      keyColIndex: keyColIndex,
      selectedClassAnnotation: selectedClassAnnotation,
      tabIndex: 0, // we want to set the currently active tab to be wrangling actions
    });
  }

  // The following functions sets the selected cell to be the search cell.
  // As a result, the column of the cell needs to be set as the search column as well.
  contextSetCell(e, rowIndex, colIndex) {
    // console.log("Row index of search cell is "+rowIndex);
    // console.log("Col index of search cell is "+colIndex);

    // This is the function that we need to fill out
    let promiseArray = [];
    // Below is the first query we will make.
    // This query fetches the neighbours for tableData[rowIndex][colIndex]. So the search cell in the search column.
    // These neighbours are either dbo or dbp, with some eliminations. In here we are using the tableCell as SUBJECT

    // Note: we need to modify this query so it looks for ranges of certain attributes as well
    let prefixURLOne =
      "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    let suffixURLOne =
      "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    let queryBodyOne =
      "SELECT+%3Fp+%3Frange%0D%0AWHERE+%7B%0D%0A+++++++dbr%3A" +
      regexReplace(this.state.tableData[rowIndex][colIndex].data) +
      "+%3Fp+%3Fo.%0D%0A+++++++OPTIONAL+%7B%3Fp+rdfs%3Arange+%3Frange%7D.%0D%0A+++++++BIND%28STR%28%3Fp%29+AS+%3FpString+%29.%0D%0A+++++++FILTER%28%0D%0A++++++++++++++%21%28regex%28%3FpString%2C%22abstract%7CwikiPage%7Calign%7Ccaption%7Cimage%7Cwidth%7Cthumbnail%7Cblank%22%2C%22i%22%29%29+%0D%0A++++++++++++++%26%26+regex%28%3FpString%2C+%22ontology%7Cproperty%22%2C+%22i%22%29%0D%0A++++++++++++++%29%0D%0A%7D&";
    let queryURLOne = prefixURLOne + queryBodyOne + suffixURLOne;
    let otherColPromiseSubject = fetchJSON(queryURLOne);
    promiseArray.push(otherColPromiseSubject);

    // Below is the second query we will make.
    // Difference with the previous query is that we are using tableData[rowIndex][colIndex] as OBJECT
    let prefixURLTwo =
      "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    let suffixURLTwo =
      "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    let queryBodyTwo =
      "SELECT+%3Fp+%0D%0AWHERE+%7B%0D%0A++++++++%3Fs+%3Fp+dbr%3A" +
      regexReplace(this.state.tableData[rowIndex][colIndex].data) +
      ".%0D%0A++++++++BIND%28STR%28%3Fp%29+AS+%3FpString+%29.%0D%0A++++++++FILTER%28%0D%0A+++++++++++++++%21%28regex%28%3FpString%2C%22abstract%7CwikiPage%7Calign%7Ccaption%7Cimage%7Cwidth%7Cthumbnail%7Cblank%22%2C%22i%22%29%29+%0D%0A+++++++++++++++%26%26+regex%28%3FpString%2C+%22ontology%7Cproperty%22%2C+%22i%22%29%0D%0A+++++++++++++++%29%0D%0A%7D%0D%0A&";
    let queryURLTwo = prefixURLTwo + queryBodyTwo + suffixURLTwo;
    let otherColPromiseObject = fetchJSON(queryURLTwo);
    promiseArray.push(otherColPromiseObject);

    // continue from here
    allPromiseReady(promiseArray).then((values) => {
      let keyColNeighbours = [];
      keyColNeighbours = updateKeyColNeighbours(
        keyColNeighbours,
        values[0].results.bindings,
        "subject"
      );
      keyColNeighbours = updateKeyColNeighbours(
        keyColNeighbours,
        values[1].results.bindings,
        "object"
      );
      // console.log(keyColNeighbours);
      let optionsMap = this.state.optionsMap.slice();
      for (let i = 0; i < optionsMap.length; ++i) {
        if (i !== colIndex) {
          optionsMap[i] = keyColNeighbours;
        }
      }
      // console.log(keyColNeighbours);
      this.setState({
        keyEntryIndex: rowIndex,
        keyColIndex: colIndex,
        keyColNeighbours: keyColNeighbours,
        curActionInfo: null,
        optionsMap: optionsMap,
        tabIndex: 0, // we want to set the currently active tab to be wrangling actions
      });
    });
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
        originElement.push(<p>--> {cellSelected.origin[i]}</p>);
      }
    }

    // This origin literal correctly contains the cell Origin we want to display
    // Now we just need to show it in the ActionPanel
    let tempObj = {};
    tempObj["task"] = "contextCellOrigin";
    tempObj["origin"] = originElement;
    this.setState({
      curActionInfo: tempObj,
      tabIndex: 0, // we want to set the currently active tab to be wrangling actions
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

  // The following function handles the selection of table.

  handleStartTable(e, tableIndex) {
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
      // console.log(selectedClassAnnotation);

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

        // Modeless Change: We need to call the helper function getTableStates.
        // By processing the tableDataExplore to get the right states for the Excel-style table.

        // To do this, we need to call getTableStates here. We just need to pass in tableDataExplore and selectedClassAnnotation 
        let statePromise = [getTableStates(tableDataExplore, selectedClassAnnotation)];
        allPromiseReady(statePromise).then((values) => {
          let stateInfo = values[0];
          // console.log(stateInfo);

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
          this.setState({
            propertyNeighbours: propertyNeighbours,
          });
        });
      });
    } else {
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

    // Start from here. We just need to modify function tableConcat
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
        tabIndex: prevState.tabIndex,
        curActionInfo: "",
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
        curActionInfo: prevState.curActionInfo,
        tableData: prevState.tableData,
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

    // This is an empty else clause.
    else {

    }
  }

  // The two following functions opens/closes the modal for union table settings.

  openModal() {
    this.setState({
      showModal: true,
    })
  }

  closeModal() {
    this.setState({
      showModal: false,
    })
  }

  // The following function toggles this.state.showTableSelection.

  toggleTableSelection() {
    let showTableSelection = !this.state.showTableSelection;
    this.setState({
      showTableSelection: showTableSelection,
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
                <div className="col-md-7 small-padding  table-panel">
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
                    contextSetCell={this.contextSetCell}
                    contextCellOrigin={this.contextCellOrigin}
                    // Folloiwng states are passed to "startTable"
                    // tableDataExplore={this.state.tableDataExplore}
                    // originTableArray={this.state.originTableArray}
                    // tableOpenList={this.state.tableOpenList}
                    // toggleTable={this.toggleTable}
                    // selectedTableIndex={this.state.selectedTableIndex}
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
                    populateSameRange={this.populateSameRange}
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
                  showModal={this.state.showModal}
                  closeModal={this.closeModal}
                  semanticEnabled={this.state.semanticEnabled}
                  toggleSemantic={this.toggleSemantic}
                  unionCutOff={this.state.unionCutOff}
                  unionCutOffChange={this.unionCutOffChange}
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

// It returns the updates keyColNeighbours
function updateKeyColNeighbours(keyColNeighbours, resultsBinding, type) {
  // Let's take a look at the resultsBinding
  // console.log("Current type is "+type);
  // console.log(resultsBinding);
  // console.log(resultsBinding);

  // we first sort the resultsBinding by p.value.slice(28)
  resultsBinding.sort((a, b) =>
    a.p.value.slice(28) > b.p.value.slice(28) ? 1 : -1
  );

  // Then we give each option in the resultBinding the correct labels
  let neighbourCount = 1;
  for (let i = 0; i < resultsBinding.length; ++i) {
    let tempObj = {};
    let curNeighbourLiteral = resultsBinding[i].p.value.slice(28);
    // Let's see if the current result has a "range"
    // Note: if the result does not have the "range" variable, resultsBinding[i].range would be undefined
    // if (type === "subject") {
    //   console.log(resultsBinding[i].range);
    // }
    // We do not want to deal with any neighbours that's only one character long: we don't know what it means
    if (curNeighbourLiteral.length > 1) {
      // Let's deal with duplicate neighbour names here
      let curNeighbourValue = curNeighbourLiteral;
      let curNeighbourLabel;
      if (type === "subject") {
        curNeighbourLabel = curNeighbourLiteral;
      } else {
        curNeighbourLabel = "is " + curNeighbourLiteral + " of";
      }
      let nextNeighbourValue = "";
      if (i < resultsBinding.length - 1) {
        nextNeighbourValue = resultsBinding[i + 1].p.value.slice(28);
      }
      if (curNeighbourValue === nextNeighbourValue) {
        if (type === "subject") {
          curNeighbourLabel = curNeighbourLiteral + "-" + neighbourCount;
        } else {
          curNeighbourLabel =
            "is " + curNeighbourLiteral + " of-" + neighbourCount;
        }
        if (neighbourCount <= maxNeighbourCount) {
          tempObj["label"] = curNeighbourLabel;
          tempObj["value"] = curNeighbourValue;
          tempObj["type"] = type;
          // If the current type is "subject", we want to see if the current result has a range
          if (type === "subject" && resultsBinding[i].range !== undefined) {
            tempObj["range"] = resultsBinding[i].range.value;
          }
          keyColNeighbours.push(tempObj);
        }
        neighbourCount++;
      } else {
        if (neighbourCount > 1) {
          if (type === "subject") {
            curNeighbourLabel = curNeighbourLiteral + "-" + neighbourCount;
          } else {
            curNeighbourLabel =
              "is " + curNeighbourLiteral + " of-" + neighbourCount;
          }
        }
        if (neighbourCount <= maxNeighbourCount) {
          tempObj["label"] = curNeighbourLabel;
          tempObj["value"] = curNeighbourValue;
          tempObj["type"] = type;
          // If the current type is "subject", we want to see if the current result has a range
          if (type === "subject" && resultsBinding[i].range !== undefined) {
            tempObj["range"] = resultsBinding[i].range.value;
          }
          keyColNeighbours.push(tempObj);
        }
        neighbourCount = 1;
      }
    }
  }
  // console.log(keyColNeighbours);
  return keyColNeighbours;
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
  // Note: the index starts from 1 because we don't care about the originURL column (column 0).
  let originCols = [];
  for (let j = 1; j < tableHeader.length; ++j) {
    originCols.push(tableHeader[j].value);
  }
  // console.log(originCols);

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
    // if (classAnnotation.length === 5 && pageName === "2008–09_Premier_League") {
      // console.log(classAnnotation);
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

// This function takes in 2 parameters:
// 1) tableDataExplore
// 2) selectedClassAnnotation

// It returns a Promise of an object with 5 properties:
// 1) keyColIndex
// 2) tableHeader
// 3) tableData
// 4) keyColNeighbours
// 5) optionsMap.

// This object contains all the information we needed for the Excel-style table

function getTableStates(tableDataExplore, selectedClassAnnotation) {
  // We need to take care of keyColIndex, tableHeader, tableData, optionsMap, and keyColNeighbours

  // tableDataExplore contains all the information we need to set the five states listed above
  // We just need to make use of the "data" and "origin" attributes. rowSpan and colSpan have no impact here.
  // Also, since we are not modifying tableDataExplore, we do not need to make a copy of it.

  // First, let's deal with keyColIndex. 
  // We will use the first column such that it's class annotation is not [] or ["Number"]
  // If no such column exists, we default it to the first column

  let keyColIndex = -1;
  for (let i=0;i<selectedClassAnnotation.length;++i) {
    if (selectedClassAnnotation[i].length > 0 
        && !(selectedClassAnnotation[i].length === 1 && selectedClassAnnotation[i][0] === "Number")) {
      // Note: we have to include the plus 1 here, because selectedClassAnnotation's length is 1 smaller than the number of columns 
      // Since OriginURL column does not have class annotation
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
      {"value":tableDataExplore[0][j].data
      ,"label":tableDataExplore[0][j].data}
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
      let originText = tableDataExplore[i][j].origin+": "+tableHeader[j].value+": "+tableDataExplore[i][j].data;
      origin.push(originText);
      tempRow.push({"data":data,"origin":origin});
    }
    tableData.push(tempRow);
  }
  // console.log("Table data is: ");
  // console.log(tableData);

  // Now, let's deal with keyColNeighbours and optionsMap
  // Note: the following part is really similar to what we have in contextSetCell
  let promiseArray = [];

  // Below is the first query we will make.
  // This query fetches the neighbours for tableData[0][keyColIndex], so the first cell in column with index keyColIndex
  // These neighbours are either dbo or dbp, with some eliminations. In here we are using the tableCell as SUBJECT

  let prefixURLOne =
    "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
  let suffixURLOne =
    "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
  let queryBodyOne =
    "SELECT+%3Fp+%3Frange%0D%0AWHERE+%7B%0D%0A+++++++dbr%3A" +
    regexReplace(tableData[0][keyColIndex].data) +
    "+%3Fp+%3Fo.%0D%0A+++++++OPTIONAL+%7B%3Fp+rdfs%3Arange+%3Frange%7D.%0D%0A+++++++BIND%28STR%28%3Fp%29+AS+%3FpString+%29.%0D%0A+++++++FILTER%28%0D%0A++++++++++++++%21%28regex%28%3FpString%2C%22abstract%7CwikiPage%7Calign%7Ccaption%7Cimage%7Cwidth%7Cthumbnail%7Cblank%22%2C%22i%22%29%29+%0D%0A++++++++++++++%26%26+regex%28%3FpString%2C+%22ontology%7Cproperty%22%2C+%22i%22%29%0D%0A++++++++++++++%29%0D%0A%7D&";
  let queryURLOne = prefixURLOne + queryBodyOne + suffixURLOne;
  let otherColPromiseSubject = fetchJSON(queryURLOne);
  promiseArray.push(otherColPromiseSubject);

  // Below is the second query we will make.
  // Difference with the previous query is that we are using tableData[0][colIndex] as OBJECT
  let prefixURLTwo =
    "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
  let suffixURLTwo =
    "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
  let queryBodyTwo =
    "SELECT+%3Fp+%0D%0AWHERE+%7B%0D%0A++++++++%3Fs+%3Fp+dbr%3A" +
    regexReplace(tableData[0][keyColIndex].data) +
    ".%0D%0A++++++++BIND%28STR%28%3Fp%29+AS+%3FpString+%29.%0D%0A++++++++FILTER%28%0D%0A+++++++++++++++%21%28regex%28%3FpString%2C%22abstract%7CwikiPage%7Calign%7Ccaption%7Cimage%7Cwidth%7Cthumbnail%7Cblank%22%2C%22i%22%29%29+%0D%0A+++++++++++++++%26%26+regex%28%3FpString%2C+%22ontology%7Cproperty%22%2C+%22i%22%29%0D%0A+++++++++++++++%29%0D%0A%7D%0D%0A&";
  let queryURLTwo = prefixURLTwo + queryBodyTwo + suffixURLTwo;
  let otherColPromiseObject = fetchJSON(queryURLTwo);
  promiseArray.push(otherColPromiseObject);

  return allPromiseReady(promiseArray).then((values) => {
    // Now we finalize the keyColNeighbours
    let keyColNeighbours = [];
    keyColNeighbours = updateKeyColNeighbours(
      keyColNeighbours,
      values[0].results.bindings,
      "subject"
    );
    keyColNeighbours = updateKeyColNeighbours(
      keyColNeighbours,
      values[1].results.bindings,
      "object"
    );
    // console.log("Key Column Neighbours are: ");
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
        "optionsMap":optionsMap
      }
    )
  })
}

// Testing repo change

