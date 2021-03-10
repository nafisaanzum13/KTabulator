// import { Route, Switch, Link } from "react-router-dom";
import React, { Component } from "react";
import { combinations } from "mathjs";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SettingModal from "../components/SettingModal";
import FilterModal from "../components/FilterModal";
import JoinModal from "../components/JoinModal";
import UnionModal from "../components/UnionModal";
import LandingPage from "../components/LandingPage";
import TablePanel from "../components/TablePanel";
import ActionPanel from "../components/ActionPanel";
import PagePanel from "../components/PagePanel";
import _ from "lodash";

const maxNeighbourCount = 10;
const maxFetchCount = 30;
const initialColNum = 4;   // initial number of columns
const initialRowNum = 15;  // initial number of rows
const numForTree = 3;      // how many entries(rows) we want to use to construct the semantic tree

class MainBody extends Component {
  constructor(props) {
    super(props);
    let tableData = [];
    let tableHeader = [];
    let optionsMap = [];
    let semanticTree = [];
    let typeRecord = [];
    // The following double loop initializes tableData
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
    // The following loop initializes semanticTree
    for (let j = 0; j < initialColNum; ++j) {
      semanticTree.push([]);
      typeRecord.push([]);
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
                               // Will be set to true and remain that way after calling populateKeyColumn, or handleStartTable
      firstColText: "",        // string storing the type-ahead text that users have typed in for first column's selection. Initially empty.
      keyCheckedIndex: -1,     // index storing the most recent index that has just been toggled for the first column. Initially -1.
      firstColHeaderInfo: [],  // 2D array of objects storing information needed to create the first column's header. (since both AND and OR need to be considered)

      // states below are useful for other column header selection
      otherColSelection: [],    // 1D array of objects storing information about the search column's neighbours
      otherColChecked: [],      // 1D array of booleans storing whether a neighbour of the search column is selected or not
      otherCheckedIndex: -1,    // index storing the most recent index that has just been toggled for a non-first column. Initially -1.
      otherColText: "",         // string storing the type-ahead text that users have typed in for other column's selection. Initially empty.

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
      checkAll: true,           // boolean that when toggled to true, all dataAndChecked will be set to true, 
                                // and when false, all dataAndChecked will be set to false.
      curFilterIndex: -1,       // number storing the index of the column on which we apply the filter. Initially -1 (no filter.)
      dataAndChecked: [],       // array of [data, checked] pairs storing which data are in the filter column, and whether we should keep them.
      filterMin: null,          // number storing min value of filter. 
      filterMax: null,          // number storing max value of filter.
    
      // states below are for table join
      showJoinModal: false,    // boolean storing whether the join option modal is show or not. Default to false.
      joinTableIndex: -1,      // number storing the index of the table we want to join from originTableArray.
      joinTableData: [],       // 2D array storing the data of the table we want to join from originTableArray. Initially empty.
      originColOptions: [],    // 1D array storing the selection options for the original table.
      joinColOptions: [],      // 1D array storing the selection options for the newly selected table.
      originJoinIndex: -1,     // number storing the index of the column of the original table that we are joining.
      joinJoinIndex: -1,       // number storing the index of the column of the newly selected table that we are joining.
      joinPairRecord: [],    // 1D array (max len 3) storing the indices of recommended join column index and join scores

      // states below are for column preview
      previewColIndex: -1,     // number storing the index of the column that we want to show preview for. 
                               // When -1, we do not want to show any preview. This state needs to be passed to TablePanel
                               // It should only be set to non -1 when we have toggled some selections on, but haven't confirmed on selections yet. 
      
      // states below are useful for cell preview and origin
      selectedCell: null,      // data in the format of tableData[i][j] (has both data and origin attribute). 
                               // (origin element can be determined from this)
      previewInfoArray: [],    // array storing the information used to create the preview element. 
                               // It contains categories, subject, object first degree neighbours.
      previewInfoExpanded: [], // array of booleans storing whether each element from previewInfoArray is expanded or not.
                               // This can only be set to true for previewInfoArray elements that have value length longer than 1.

      // states below are for customized table union
      unionURL: "",            // user-pasted URL, so that they can union table with customized table. If "", nothing has ever been pasted yet.
      unionTableArray: [],     // 1D array storing all tables found on union URL.
      unionOpenList: [],       // 1D array of bools storing whether each table in unionTableArray has been toggled open or not.
      showUnionModal: false,   // boolean storing whether the union modal should be shown or not.

      // states below are for the semantic tree
      semanticTree: semanticTree,   // array (length = num of columns) storing the semantic tree for each column in the table
      typeRecord: typeRecord,       // array (length = num of columns) storing the rdf:type for (3 entities from) each column in the table
                                    // Each element has two fields: data, type.
    };

    // functions below are useful during start up
    this.handleURLPaste = this.handleURLPaste.bind(this);
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
    this.sameNeighbourDiffRow = this.sameNeighbourDiffRow.bind(this);
    this.sameNeighbourOneRow = this.sameNeighbourOneRow.bind(this);

    // functions below are for column processing
    this.contextAddColumn = this.contextAddColumn.bind(this);
    this.contextDeleteColumn = this.contextDeleteColumn.bind(this);
    this.contextSetColumn = this.contextSetColumn.bind(this);
    this.originPreviewPage = this.originPreviewPage.bind(this);
    this.contextSortColumn = this.contextSortColumn.bind(this);
    this.contextDedupColumn = this.contextDedupColumn.bind(this);
    this.showFilterMethods = this.showFilterMethods.bind(this);

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
    this.toggleAll = this.toggleAll.bind(this);
    this.applyFilter = this.applyFilter.bind(this);
    this.handleRangeFilter = this.handleRangeFilter.bind(this);

    // functions below are for join feature
    this.handleJoinTable = this.handleJoinTable.bind(this);
    this.cancelJoin = this.cancelJoin.bind(this);
    this.selectJoinColumn = this.selectJoinColumn.bind(this);
    this.runJoin = this.runJoin.bind(this);

    // functions below are for first column selection
    this.toggleFirstNeighbour = this.toggleFirstNeighbour.bind(this);
    this.handlePlusClick = this.handlePlusClick.bind(this);
    this.addToFirstCol = this.addToFirstCol.bind(this);
    this.confirmAddFirstCol = this.confirmAddFirstCol.bind(this); 
    this.firstColTextChange = this.firstColTextChange.bind(this);

    // functions below are for other column selection
    this.toggleOtherNeighbour = this.toggleOtherNeighbour.bind(this);
    this.otherColTextChange = this.otherColTextChange.bind(this);

    // functions below are for cell preview and origin
    this.togglePreviewElement = this.togglePreviewElement.bind(this);

    // functions below are for recommendations
    this.populateRecommendation = this.populateRecommendation.bind(this);
    this.createStartRecommend = this.createStartRecommend.bind(this);
    this.populateStartRecommend = this.populateStartRecommend.bind(this);

    // functions below are for table union in startSubject case
    this.handleUnionPaste = this.handleUnionPaste.bind(this);
    this.toggleUnionTable = this.toggleUnionTable.bind(this);
    this.showUnionAlign = this.showUnionAlign.bind(this);
    this.cancelUnionAlign = this.cancelUnionAlign.bind(this);
    this.hardcodeUnion = this.hardcodeUnion.bind(this);

    // functions below are for file uploading/sharing
    this.handleFileChange = this.handleFileChange.bind(this);
  }

  // As soon as the URL has been pasted, we want to fetch all tables from the pasted URL.
  // We then update the originTableArray, which stores all the tables found on the pasted URL
  // We also initialize tableOpenList to all false
  handleURLPaste(urlPasted) {
    document.body.classList.add('waiting');

    // We first check if user has pasted a valid wikipedia page.

    if (!urlPasted.includes("https://en.wikipedia.org/wiki/")) {
      document.body.classList.remove('waiting');
      alert("Please paste a valid Wikipedia link.");
    }

    // If yes, we fetch the tables from the pasted Wikipedia page
    else {
      let promiseArray = [];
      promiseArray.push(fetchText(urlPasted));
      allPromiseReady(promiseArray).then((values) => {
        // We first parse the pasted URL and store the list of tables from the pasted URL
        let htmlText = values[0];
        let doc = new DOMParser().parseFromString(htmlText, "text/html");
        let wikiTableArray = doc.getElementsByClassName("wikitable");
        let originTableArray = [];
        for (let i = 0; i < wikiTableArray.length; ++i) {
          // console.log(wikiTableArray[i].rows);
          if (wikiTableArray[i].tagName === "TABLE" && wikiTableArray[i].rows !== undefined) {
            originTableArray.push(wikiTableArray[i]);
          }
        }
        console.log(originTableArray);
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

  // This function copies the table content to clipboard

  copyTable() {
    const textArea = document.createElement("textarea"); // this line allows the use of select() function
    let copiedText = "";

    // This case handles the copy table for start subject
    if (this.state.usecaseSelected === "startSubject" || this.state.usecaseSelected === "startTable") {
      // We first push on the text for column headers (using the labels)
      let tableHeader = this.state.tableHeader;
      for (let i = 0; i < tableHeader.length; ++i) {
        // console.log(tableHeader[i]);
        let curText = "";
        // This first condition deals with first column's header text
        if (i === 0) {
          // First subcase: starting table
          if (this.state.usecaseSelected === "startTable") {
            curText = "OriginURL";
          }
          // Second subcase: starting entity
          else {
            for (let j = 0; j < tableHeader[i].length; ++j) {
              if (j > 0) {
                curText += " AND "; 
              }
              curText += niceRender(tableHeader[i][j].oValue);
            }
          }
        }
        // This condition deals with other column's header text
        else {
          for (let j = 0; j < tableHeader[i].length; ++j) {
            if (j > 0) {
              curText += " OR ";
            }
            let textToAdd = tableHeader[i][j].type === "object" ? "is " + tableHeader[i][j].value + " of" : tableHeader[i][j].value;
            curText += textToAdd;
          }
        }
        copiedText = copiedText + curText + "\t";
      }
      copiedText += "\n";
      // Now we need to fetch the rows that are not column headers
      let tableData = this.state.tableData;
      const rowNum = tableData.length;
      const colNum = tableData[0].length;
      for (let i = 0; i < rowNum; ++i) {
        for (let j = 0; j < colNum; ++j) {
          let curText = niceRender(tableData[i][j].data);
          if (curText !== undefined) {
            copiedText = copiedText + curText + "\t";
          }
        }
        copiedText += "\n";
      }
    }
    textArea.value = copiedText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    alert("Table content has been exported!");
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
          curActionInfo: tempObj,
          tabIndex: 0,
          firstColText: "", // updated on August 26th
          lastAction: lastAction,
          prevState: prevState,
        });
      })
    } 
  }

  // This function handles the toggling of the starting subject's neighbours
  // Also, we store this toggledIndex, so that we can display the suggestion text at the right location.
  // Obviously, we need to update this.state.firstColChecked array.

  toggleFirstNeighbour(e, index) {
    // console.log("Toggled index is "+index);
    
    // We first create a copy of firstColChecked
    let firstColChecked = this.state.firstColChecked.slice();

    // Now we deal with keyCheckedIndex
    let keyCheckedIndex = index;
  
    // We handle the toggling here
    firstColChecked[index] = !firstColChecked[index];

    // Lastly, we make the state changes
    this.setState({
      firstColChecked:firstColChecked,
      keyCheckedIndex:keyCheckedIndex,
      firstColText: "",
    })
  }

  // This function handles users typing into the type aheader for first column's neighbour selections
  firstColTextChange(e) {
    e.preventDefault();
    let firstColText = e.target.value;
    this.setState({
      firstColText: firstColText,
    })
  }

  // This function handles the toggling of a non-first column's attribute selection
  // Note: since the preview feature is being addded, this function needs to handle preview as well.
  // It will handle the preview similarly to how it handles populateOtherColumn, 
  // Except it sets previewData attribute, instead of data attribute.
  toggleOtherNeighbour(e, neighbourIndex, colIndex) {
    // We first get all the variables we needed
    let previewColIndex;
    let tableData = _.cloneDeep(this.state.tableData); 
    let otherColChecked = _.cloneDeep(this.state.otherColChecked);

    // We first deal with the toggling of otherCheckedIndex and otherColChecked
    let otherCheckedIndex = neighbourIndex;
    otherColChecked[neighbourIndex] = !otherColChecked[neighbourIndex];

    // We then deal with column preview.

    // First step is to create a selectedNeighbours array for preview, similar to OtherColSelection.
    // We will create the selectedNeighbours array from otherColSelection and otherColChecked
    let selectedNeighbours = [];
    for (let i = 0; i < otherColChecked.length; ++i) {
      if (otherColChecked[i] === true) {
        selectedNeighbours.push(this.state.otherColSelection[i]);
      }
    }
    // console.log(selectedNeighbours);
    // console.log(colIndex);
    
    // If selectedNeighbours is non-empty, we need to set previewColIndex to colIndex, and set tableData's previewData attribute
    if (selectedNeighbours.length > 0) {
      // We first set tableData, based on selectedNeighbours and colIndex. The following part will be similar to populateOtherColumn.
      for (let i = 0; i < tableData.length; ++i) {
        // curColumnArray is the previewData array, for each entry in search column, for all neighbours in selectedNeighbours
        let curColumnArray = [];
        // We loop through selectedNeighbours
        for (let j = 0; j < selectedNeighbours.length; ++j) {
          let curNeighbour = selectedNeighbours[j];
          let firstDegNeighbours = 
            curNeighbour.type === "subject" ? this.state.firstDegNeighbours.subject : this.state.firstDegNeighbours.object;
          let curNeighbourData = firstDegNeighbours[i][curNeighbour.value];
          if (curNeighbourData !== undefined) {
            curColumnArray = curColumnArray.concat(curNeighbourData);
          }
        }
        // If curColumnArray is empty, that means this entry in search column do not have any of the attributes from selectedNeighbours
        // We want to set previewData to N/A
        if (curColumnArray.length === 0) {
          tableData[i][colIndex].previewData = "N/A";
        }
        // Else, we have found at least one value. We want to set previewData to curColumnArray[0]
        else {
          tableData[i][colIndex].previewData = curColumnArray[0];
        }
      }

      // Now that we are done with setting tableData, we set previewColIndex.
      previewColIndex = colIndex;
    }
    // In this case, selectedNeighbours is empty, we want to set previewColIndex back to -1.
    else {
      previewColIndex = -1;
    }

    // Support for undo:
    let lastAction = "toggleOtherNeighbour";
    let prevState = 
    {
      otherColChecked: this.state.otherColChecked,
      otherColCheckedIndex: this.state.otherCheckedIndex,
      tableData: this.state.tableData,
      previewColIndex: this.state.previewColIndex,
    }

    this.setState({
      otherColChecked: otherColChecked,
      otherCheckedIndex: otherCheckedIndex,
      tableData: tableData,
      previewColIndex: previewColIndex,
      otherColText: "",
      lastAction: lastAction,
      prevState: prevState,
    })
  }

  // This function handles user typing into the type-ahead for other column's neighbour selection

  otherColTextChange(e) {
    e.preventDefault();
    let otherColText = e.target.value;
    this.setState({
      otherColText: otherColText,
    })
  }


  // This function is a simple function that creates an object and passes to Action Panel
  handlePlusClick() {
    this.setState({
      curActionInfo:{"task":"plusClicked"},
      previewColIndex: -1, // we also want to set preview column index to -1 (clear previews)
      tabIndex: 0,
    })
  }

  // This function handles when users want to add more entities to the first column
  addToFirstCol() {
    // We need to make the Action Panel display FirstColSelection component again.
    // Before doing so, we need to first clear out this.state.firstColChecked, and this.state.keyCheckedIndex
    // So that we do not have information carried over from the previous first column selection.

    // First we update firstColChecked
    let firstColCheckedUpdated = [];
    for (let i = 0; i < this.state.firstColChecked.length; ++i) {
      firstColCheckedUpdated.push(false);
    }

    // Then we reset keyCheckedIndex
    let keyCheckedIndexUpdated = -1;

    // We now set up tempObj for Action Panel
    let tempObj = {
      "task":"afterStartSubject",
    };

    // Finallym we set the states.
    this.setState({
      firstColChecked:firstColCheckedUpdated,
      keyCheckedIndex:keyCheckedIndexUpdated,
      curActionInfo:tempObj,
      firstColText: "", // updated on August 26th
    })
  }

  // This function handles manually changing cell in a table.
  // Other than manipulating the data, it does one check: 
  // If this.state.tableHeader[j] is empty ([]), we set tableHeader[j] as [{"value":"Notes", "type":"Subject"}]
  cellChange(e, i, j) {
    e.preventDefault();
    let tableData = this.state.tableData.slice();
    tableData[i][j].data = e.target.value;

    // Below is added on August 25th:
    let tableHeader = _.cloneDeep(this.state.tableHeader);
    if (tableHeader[j].length === 0) {
      tableHeader[j] = [
        {
          "value":"Notes",
          "label":"Notes",
          "type":"subject",
        }
      ]
    }
    this.setState({
      tableData: tableData,
      tableHeader: tableHeader,
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

  // This function updates the options for selections when we want to open selection for non-key column
  // based on cells already filled in this column, and the cells in the key column
  // aka: Michelle Obama is Barack Obama' wife

  // It needs to update Action Panel to display the correct content.

  // If this column is empty or completely filled, it will just pass keyColNeighbours to Action Panel.

  getOtherOptions(e, colIndex) {

    // console.log("Column index clicked is "+colIndex);

    // console.log(this.state.keyColNeighbours);

    // The first thing we need to do is to determine the content for otherColSelection
    let otherColSelection = [];

    // We check if this column is all-empty, or all filled
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

    // Case 1:
    // If this column is non-empty, and not completely filled, we want to deal with special otherColSelection
    if (colEmpty === false && colFilled === false) {
      document.body.classList.add('waiting');
      let prefixURL =
        "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
      let suffixURL =
        "%0D%0A%7D%0D%0A%0D%0A&format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
      let queryBody = "SELECT+%3Fsomevar%0D%0AWHERE+%7B";
      // Bugfix added on August 17th: instead of using every entry from nonEmptyInfo to determine the relation, we will use the first one
      // for (let i = 0; i < nonEmptyInfo.length; ++i) {
      for (let i = 0; i < 1; ++i) {
        let curKeySubject = regexReplace(
          this.state.tableData[nonEmptyInfo[i][0]][this.state.keyColIndex].data
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
      // we create a temporary variable to hold results from myJson.results.bindings
      let tempSelection = [];
      for (let i = 0; i < myJson.results.bindings.length; ++i) {
        let tempObj = {};
        let neighbour = myJson.results.bindings[i].somevar.value.slice(28);
        tempObj["label"] = neighbour;
        tempObj["value"] = neighbour;
        tempObj["type"] = "subject"; // for now we only allow the subject search
        tempSelection.push(tempObj);
      }
      // We push onto otherColSelection the right elements from keyColNeighbours, based on tempSelection
      // console.log(this.state.keyColNeighbours);
      // console.log(tempSelection);
      for (let i = 0; i < tempSelection.length; ++i) {
        for (let j = 0; j < this.state.keyColNeighbours.length; ++j) {
          if (tempSelection[i].value === this.state.keyColNeighbours[j].value 
              && tempSelection[i].type === this.state.keyColNeighbours[j].type) {
            otherColSelection.push(this.state.keyColNeighbours[j]);
            break; 
          }
        }
      }
      // Now, we do not want to have an empty otherColSelection.
      // Thus, if it is, we just want to set it as this.state.keyColNeighbours
      if (otherColSelection.length === 0) {
        otherColSelection = this.state.keyColNeighbours;
      }
      // Take a look at otherColSelection
      // console.log(otherColSelection);

      // Now we have figured out the content for otherColSelection, we move on otherColChecked and otherCheckedIndex.
      // Every time we are running this function, we need to reset otherColChecked and otherCheckedIndex

      let otherColChecked = [];
      for (let i = 0; i < otherColSelection.length; ++i) {
        otherColChecked.push(false);
      }
      let otherCheckedIndex = -1;

      let tempObj = 
        {
          "task":"showOtherColSelection",
          "colIndex":colIndex,
        }

      document.body.classList.remove('waiting');
      this.setState({
        otherColSelection:otherColSelection,
        otherColChecked:otherColChecked,
        otherColText: "",  // Modified on August 26th: every time we click on this edit icon, we want to reset otherColText
        otherCheckedIndex:otherCheckedIndex,
        curActionInfo:tempObj,
        previewColIndex: -1,
      })
      })
    }

    // Case 2:
    // If this column is empty or completely filled, we just set otherColSelection to be keyColNeighbours
    else {
      otherColSelection = this.state.keyColNeighbours;
      // Take a look at otherColSelection
      // console.log(otherColSelection);

      // Now we have figured out the content for otherColSelection, we move on otherColChecked and otherCheckedIndex.
      // Every time we are running this function, we need to reset otherColChecked and otherCheckedIndex

      // Maybe some modifications need to be done here when colFilled === true
      let otherColChecked = [];
      for (let i = 0; i < otherColSelection.length; ++i) {
        otherColChecked.push(false);
      }
      let otherCheckedIndex = -1;

      let tempObj = 
        {
          "task":"showOtherColSelection",
          "colIndex":colIndex,
        }

      window.scrollTo(0, 0);
      this.setState({
        otherColSelection:otherColSelection,
        otherColChecked:otherColChecked,
        otherColText: "",  // Modified on August 26th: every time we click on this edit icon, we want to reset otherColText
        otherCheckedIndex:otherCheckedIndex,
        curActionInfo:tempObj,
        previewColIndex: -1,
      })
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

    // BUGFIX August 17th: The query below may need to be used for performance issues

    // select ?s ?p ?range ?subPropertyOf
    // where {
    // ?s ?p dbr:Barack_Obama.
    // OPTIONAL {?p rdfs:range ?range}.
    // OPTIONAL {?p rdfs:subPropertyOf ?subPropertyOf}.
    // {
    // select ?p (count(?s) as ?count) 
    // where {
    // ?s ?p dbr:Barack_Obama
    // }
    // group by ?p
    // having (count(?s) <= maxFetchCount)
    // }
    // }

    let promiseArray = [];
    let prefixURL =
      "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    let suffixURL =
      "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    for (let i = 0; i < tableData.length; ++i) {
      let cellValue = tableData[i][colIndex].data === "N/A" ? "NONEXISTINGSTRING" : regexReplace(tableData[i][colIndex].data);
      // console.log(cellValue);
      let queryBody;
      if (type === "subject") {
        queryBody =
          "select+%3Fp+%3Fo+%3Frange+%3FsubPropertyOf%0D%0Awhere+%7B%0D%0Adbr%3A" +
          cellValue +
          "+%3Fp+%3Fo.%0D%0AOPTIONAL+%7B%3Fp+rdfs%3Arange+%3Frange%7D.%0D%0AOPTIONAL+%7B%3Fp+rdfs%3AsubPropertyOf+%3FsubPropertyOf%7D.%0D%0A%7D&";
      }
      else {
        // queryBody = 
        //   "select+%3Fs+%3Fp+%3Frange+%3FsubPropertyOf%0D%0Awhere+%7B%0D%0A%3Fs+%3Fp+dbr%3A" +
        //   cellValue +
        //   ".%0D%0AOPTIONAL+%7B%3Fp+rdfs%3Arange+%3Frange%7D.%0D%0AOPTIONAL+%7B%3Fp+rdfs%3AsubPropertyOf+%3FsubPropertyOf%7D.%0D%0A%7D&";

        // Above code is the query before bugfix on August 17th. Below is the fixed version of the code
        queryBody = 
          "select+%3Fs+%3Fp+%3Frange+%3FsubPropertyOf%0D%0Awhere+%7B%0D%0A%3Fs+%3Fp+dbr%3A" + 
          cellValue + 
          ".%0D%0AOPTIONAL+%7B%3Fp+rdfs%3Arange+%3Frange%7D.%0D%0AOPTIONAL+%7B%3Fp+rdfs%3AsubPropertyOf+%3FsubPropertyOf%7D.%0D%0A%7B%0D%0Aselect+%3Fp+%28count%28%3Fs%29+as+%3Fcount%29+%0D%0Awhere+%7B%0D%0A%3Fs+%3Fp+dbr%3A" +
          cellValue + 
          "%0D%0A%7D%0D%0Agroup+by+%3Fp%0D%0Ahaving+%28count%28%3Fs%29+%3C%3D+" + 
          maxFetchCount +
          "%29%0D%0A%7D%0D%0A%7D%0D%0A&";
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

  // Instead of having a fixed number of entries in the key column,
  // We have made it more flexible. (but also pose a limit, so we don't get way too many entries)

  populateKeyColumn(e, colIndex, neighbourArray) {
    // Let's first take a look at parameters passed in
    // console.log(colIndex);
    // console.log(neighbourArray);

    // Let's create a helper function to generate the query text.
    let queryURL = keyQueryGen(neighbourArray)
    // console.log(queryURL);

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

        // Addition: we want to display the first column's header correctly. Let's add support for that
        let firstColHeaderInfo = [];
        firstColHeaderInfo.push(neighbourArray);
  
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

        // Now we construct the semantic tree for the first column
        // We first randomly get a number of (Math.min(tableData.length, numForTree)) samples from tableData
        let sampleRows = _.sampleSize(tableData, Math.min(tableData.length, numForTree));
        let promiseArrayThree = getRDFType(sampleRows, 0);

        allPromiseReady(promiseArrayOne).then((valuesOne) => {
        allPromiseReady(promiseArrayTwo).then((valuesTwo) => {
        allPromiseReady(promiseArrayThree).then((valuesThree) => {
          // console.log(typeRecord);

          // console.log(valuesOne);
          // console.log(valuesTwo);
          // console.log(valuesThree);

          // Support for semantic tree: we write a helper function here to 

          // Modified on Sept 13th: whenever updateNeighbourInfo is called, updateUnionSelection should also be called
          // updateUnionSelection should basically be a looped version for updateFirstColSelection
          let selectionInfo = updateUnionSelection(valuesOne);
          // console.log(selectionInfo);

          // We call updateNeighbourInfo here because we are changing the rows
          let updatedNeighbours = updateNeighbourInfo(valuesOne, valuesTwo);
          let keyColNeighbours = updatedNeighbours.keyColNeighbours;
          let firstDegNeighbours = updatedNeighbours.firstDegNeighbours;

          // In here we call another helper function to store the ontology rdf:type of the sampleRows
          // to support semantic tree
          let curColumnRecord = buildTypeRecord(sampleRows, 0, valuesThree)
          let typeRecord = _.cloneDeep(this.state.typeRecord);
          typeRecord[0] = curColumnRecord;

          // Lastly, we set up the information for the action panel
          let tempObj = {};
          tempObj["task"] = "showStartRecommend";
          tempObj["colIndex"] = colIndex;
          tempObj["recommendArray"] = this.createStartRecommend(keyColNeighbours);
  
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
              "firstColFilled":this.state.firstColFilled,
              "firstColHeaderInfo":this.state.firstColHeaderInfo,
              "firstColSelection":this.state.firstColSelection, // updated on Sept 13th
              "firstColChecked":this.state.firstColChecked, // updated on Sept 13th
              "typeRecord":this.state.typeRecord,
            };

          document.body.classList.remove('waiting');
  
          this.setState({
            keyColIndex: colIndex,
            keyColNeighbours: keyColNeighbours,
            firstDegNeighbours: firstDegNeighbours,
            curActionInfo: tempObj, // Changed on Aug 20th
            tableData: tableData,
            tableHeader: tableHeader,
            firstColFilled: true,
            firstColHeaderInfo: firstColHeaderInfo,
            firstColText: "", // updated on August 26th
            lastAction: lastAction,
            prevState: prevState,
            firstColSelection: selectionInfo.firstColSelection,
            firstColChecked: selectionInfo.firstColChecked,
            typeRecord: typeRecord,
          });
        })
        })
        })
      });
    }
  }

  // This function adds more entities to the first column.
  // It should be similar to populateKeyColumn, with some differences

  confirmAddFirstCol(e, neighbourArray) {

    // Support for autofill starts here
    // Let's figure out what's currently in the table first.
    // console.log(this.state.tableHeader);
    let autoFillInfo = getAutofillInfo(this.state.tableData);
    console.log(autoFillInfo);

    // console.log(neighbourArray);
    let queryURL = keyQueryGen(neighbourArray);

    // Let's first make sure that the neighbourArray do not contain attributes of unknown datatypes.
    if (queryURL === "ERROR") {
      alert("Unsupported datatype in selected neighbours. Please select some other neighbours.");
    }

    else {
      document.body.classList.add("waiting");

      let promiseArray = [fetchJSON(queryURL)];

      allPromiseReady(promiseArray).then((values) => {
        // console.log(values[0].results.bindings);
        // Now we append the new query results to tableData
        let numNewRows = Math.min(values[0].results.bindings.length, initialRowNum);
        let tableData = [];
        // We first push on numNewRows number of rows, while setting up data and origin
        for (let i = 0; i < numNewRows; ++i) {
          let tempRow = [];
          for (let j = 0; j < this.state.tableHeader.length; ++j) {
            if (j === 0) {
              tempRow.push({
                data: values[0].results.bindings[i].somevar.value.slice(28),
                origin: [values[0].results.bindings[i].somevar.value.slice(28)]
              })
            }
            else {
              // We do not have support for autofill at this step yet.
              tempRow.push({ data: "", origin: []});
            }
          }
          tableData.push(tempRow);
        }

        // To support autofill, let's also store the starting index of the newly appended data
        let fillStartIndex = this.state.tableData.length;
        // We concat this.state.tableData and tableData together, and dedup by first column's data
        tableData = _.cloneDeep(this.state.tableData).concat(tableData);
        tableData = _.uniqBy(tableData, function(x) {return x[0].data;});
        // console.log(tableData);

        // Now, we move on to update firstDegNeighbours and keyColNeighbours
        let promiseArrayOne = this.getNeighbourPromise(tableData, "subject", 0);
        let promiseArrayTwo = this.getNeighbourPromise(tableData, "object", 0);

        // In here we add support for auto-fill information:
        // In here we make use of the autofillFarPromise helper function to get the 2nd and 3rd deg neighbours
        let columnInfo = autoFillInfo.columnInfo;
        let autoPromise = autofillFarPromise(tableData, columnInfo, fillStartIndex);
        allPromiseReady(promiseArrayOne).then((valuesOne) => {
        allPromiseReady(promiseArrayTwo).then((valuesTwo) => {
        allPromiseReady(autoPromise).then((valuesAuto) => {

          // console.log(valuesAuto)

          let selectionInfo = updateUnionSelection(valuesOne); // Sept 13 update
  
          // We call updateNeighbourInfo here because we are changing the rows
          let updatedNeighbours = updateNeighbourInfo(valuesOne, valuesTwo);
          let keyColNeighbours = updatedNeighbours.keyColNeighbours;
          let firstDegNeighbours = updatedNeighbours.firstDegNeighbours;

          // This is where we can start working on the auto-fill
          // Let's first look at fillStartIndex, tableData, and autoFillInfo
          // console.log("New entries' starting index is "+fillStartIndex);
          // console.log(tableData);
          // console.log(autoFillInfo);
          // console.log(firstDegNeighbours);

          // console.log(valuesAuto);

          // Now we call a helper function to process valuesAuto
          // Specifically, we want to get an array of arrays of string, as data for the 2nd/3rd deg neighbour columns
          let farArray = processFarDeg(columnInfo, valuesAuto);
          // This farArray contains all the information we needed. We set a starting index
          let farIndex = 0;

          // Stepone: Write a helper function to fill in the one-deg neighbours first
          // This information should already exists in firstDegNeighbours
          for (let i = 0; i < columnInfo.length; ++i) {
            // We are currently dealing with curColumn_th column in the table
            let curColumn = i + 1;
            // If it is a one-deg neighbour, we call the autofillFirstDeg to update tableData
            if (columnInfo[i].length === 1) {
              tableData = 
                autofillFirstDeg(tableData, 
                                 columnInfo[i], 
                                 curColumn, 
                                 fillStartIndex, 
                                 firstDegNeighbours, 
                                 this.state.keyColIndex);
            }
            // It it is a 2nd/3rd deg neighbour, we call autofillFarDeg to update tableData
            if (columnInfo[i].length === 2 || columnInfo[i].length === 3) {
              tableData = 
                autofillFarDeg(tableData,
                               columnInfo[i],
                               farArray[farIndex],
                               curColumn,
                               fillStartIndex);
              // We also need to update farIndex
              ++farIndex;
            }
          }

          document.body.classList.remove('waiting');

          // Lastly, we display a warning if autoFillInfo.longHopWarning is true
          if (autoFillInfo.longHopWarning) {
            alert("Neighbours more than 3 hops away is not autofilled.");
          }

          let firstColHeaderInfo = _.cloneDeep(this.state.firstColHeaderInfo);
          firstColHeaderInfo.push(neighbourArray);

          // Support for undo
          let lastAction = "confirmAddFirstCol";
          let prevState = 
            {
              "tableData": this.state.tableData,
              "keyColNeighbours": this.state.keyColNeighbours,
              "firstDegNeighbours": this.state.firstDegNeighbours,
              "firstColHeaderInfo": this.state.firstColHeaderInfo,
              "previewColIndex": this.state.previewColIndex,
              "firstColSelection": this.state.firstColSelection, // updated on 9/13
              "firstColChecked": this.state.firstColChecked, // updated on 9/13
            }
  
          this.setState({
            tableData: tableData,
            keyColNeighbours: keyColNeighbours,
            firstDegNeighbours: firstDegNeighbours,
            firstColHeaderInfo: firstColHeaderInfo,
            curActionInfo: {"task":"afterPopulateColumn"},
            previewColIndex: -1,
            firstColText: "", // updated on August 26th
            firstColSelection: selectionInfo.firstColSelection,
            firstColChecked: selectionInfo.firstColChecked,
            lastAction: lastAction,
            prevState: prevState,
          });
        })
        })
        })
      })
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

    document.body.classList.add('waiting');

    // Start from here
    // console.log(this.state.typeRecord);

    // console.log(colIndex);
    // console.log(neighbourArray);

    let tableData = _.cloneDeep(this.state.tableData);
    // We use a boolean to keep track of if any cell contains multiple values
    let hasMultiple = false;

    for (let i = 0; i < tableData.length; ++i) {
      // curColumnArray is the dataArray for each entry in search column, for all neighbours in neighbourArray.
      let curColumnArray = [];
      // We loop through the neighbourArray
      for (let j = 0; j < neighbourArray.length; ++j) {
        // For each neighbour in neighbourArray, we check to see if entries in search column have values for this neighbour
        let curNeighbour = neighbourArray[j];
        let firstDegNeighbours = 
          curNeighbour.type === "subject" ? this.state.firstDegNeighbours.subject : this.state.firstDegNeighbours.object;
        // console.log(firstDegNeighbours);
        let curNeighbourData = firstDegNeighbours[i][curNeighbour.value];
        // console.log("Current neighbour data is "+curNeighbourData);
        // If yes, we want to concat those values with curColumnArray
        if (curNeighbourData !== undefined) {
          curColumnArray = curColumnArray.concat(curNeighbourData);
        }
      }
      // console.log(neighbourArray);
      // If curColumnArray is empty, that means this entry in searchColumn do not have any of the attributes from neighbourArray
      if (curColumnArray.length === 0) {
        // we set the data to N/A
        let curData = "N/A";
        tableData[i][colIndex].data = curData;
        // Note that we still want to set origin to support autofill
        let originToAdd = createNeighbourText(neighbourArray) + ":" + curData;
        let keyOrigin = tableData[i][this.state.keyColIndex].origin.slice();
        keyOrigin.push(originToAdd);
        tableData[i][colIndex].origin = keyOrigin;
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

        // Now, if curColumnArray has length longer than one, we want to set hasMultiple to true
        // We also create an extra attribute for the current tableData cell, called dataArray, whose max length is maxNeighbourCount.
        if (curColumnArray.length > 1) {
          hasMultiple = true;
          let lastIndex = Math.min(curColumnArray.length, maxNeighbourCount);
          tableData[i][colIndex].dataArray = curColumnArray.slice(1, lastIndex);
        } 
      }
    }
    // Now, we are done with updating tableData.
    // We want to update tableHeader as well.
    let tableHeader = _.cloneDeep(this.state.tableHeader);
    tableHeader[colIndex] = neighbourArray;

    // We start setting up the content for the Action Panel.

    let recommendArray = createRecommendArray(neighbourArray, this.state.keyColNeighbours);
    // console.log(recommendArray);

    // tempObj stores the information passed to ActionPanel
    let tempObj = {};

    // Case 1: hasMultiple is true, and there are recommendations
    if (hasMultiple === true && recommendArray.length > 0) {
      tempObj["task"] = "sameNeighbourAndRecommendation";
      tempObj["colIndex"] = colIndex;
      tempObj["neighbourArray"] = neighbourArray;
      tempObj["recommendArray"] = recommendArray;
    }
    // Case 2: only hasMultiple is true
    else if (hasMultiple === true) {
      tempObj["task"] = "populateSameNeighbour";
      tempObj["colIndex"] = colIndex;
      tempObj["neighbourArray"] = neighbourArray;
    }
    // Case 3: only hasRecommendation is true
    else if (recommendArray.length > 0) {
      tempObj["task"] = "populateRecommendation";
      tempObj["colIndex"] = colIndex;
      tempObj["recommendArray"] = recommendArray; 
    }
    // Case 4: neither hasMultiple or hasRecommendation is true. In which case we just tell users that they can fill more columns.
    else {
      tempObj["task"] = "afterPopulateColumn";
    }

    // Now we construct the semantic tree for the this column
    // We first randomly get a number of (Math.min(tableData.length, numForTree)) samples from tableData
    let sampleRows = _.sampleSize(tableData, Math.min(tableData.length, numForTree));
    let promiseArray = getRDFType(sampleRows, colIndex);
    allPromiseReady(promiseArray).then((values) => {
    // In here we call another helper function to store the ontology rdf:type of the sampleRows
    // to support semantic tree
    let curColumnRecord = buildTypeRecord(sampleRows, colIndex, values)
    let typeRecord = _.cloneDeep(this.state.typeRecord);
    typeRecord[colIndex] = curColumnRecord;

    document.body.classList.remove('waiting');

    // Support for undo: 
    // Let's save the previous state in an object
    let lastAction = "populateOtherColumn";
    let prevState = 
      {
        "curActionInfo":this.state.curActionInfo,
        "tableData":this.state.tableData,
        "tableHeader":this.state.tableHeader,
        "previewColIndex":this.state.previewColIndex,
        "otherColText": this.state.otherColText,
        "typeRecord": this.state.typeRecord,
      };

    this.setState({
      curActionInfo: tempObj,
      tableData: tableData,
      tableHeader: tableHeader,
      previewColIndex: -1,
      otherColText: "",
      lastAction: lastAction,
      prevState: prevState,
      typeRecord: typeRecord,
    });
    })


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
          "label" : ownLabel + "--" + keyColLabel,
          "type"  : neighbourArray[0].type,
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
          let curData = "N/A";
          tableDataUpdated[i][curCol].data = curData;
          // Note that we still want to set origin to support autofill
          let originToAdd = createNeighbourText(neighbourArray) + ":" + curData;
          let keyOrigin = tableData[i][this.state.keyColIndex].origin.slice();
          keyOrigin.push(originToAdd);
          tableData[i][colIndex].origin = keyOrigin;
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

  // This function populates all neighbour with the same names in different rows, if that neighbour has multiple occurences.
  // It should modify both tableData and firstDegNeighbours, but not keyColNeighbours.
  // This is because we are not removing, or adding anything new, to the search column.

  sameNeighbourDiffRow(e,colIndex,neighbourArray) {

    // First we take a look at the parameters passed in
    // console.log(colIndex);
    // console.log(neighbourArray);
    // console.log(this.state.tableData);

    let tableDataUpdated = [];
    let subjectNeighbours = [];
    let objectNeighbours = [];
    let tableData = _.cloneDeep(this.state.tableData);
    let firstDegNeighbours = _.cloneDeep(this.state.firstDegNeighbours);

    // The first loop deals with tableData's additions 
    for (let i = 0; i < tableData.length; ++i) {
      // We first create a deep copy of the current row
      let curRow = _.cloneDeep(tableData[i]);
      // If the current cell in the selected column does NOT have dataArray attribute, we push it onto tableData as it is
      if (curRow[colIndex].dataArray === undefined) {
        tableDataUpdated.push(curRow);
      }
      // Else, we have to push on dataArray.length number of new rows onto tableData.
      // We need to take care of the new cell's data, origin, and dataArray
      else {
        // First, we still need to push on curRow
        tableDataUpdated.push(curRow);
        // Then, we deal with rows that are not in the original table
        for (let j = 0; j < curRow[colIndex].dataArray.length; ++j) {
          let rowToAdd = _.cloneDeep(curRow);
          // We set data
          rowToAdd[colIndex].data = curRow[colIndex].dataArray[j];
          // we then set origin for the cell. Need to use neighbourArray to get the correct text for the origin
          let originToAdd = createNeighbourText(neighbourArray) + ":" + curRow[colIndex].dataArray[j];
          let keyOrigin = tableData[i][this.state.keyColIndex].origin.slice();
          keyOrigin.push(originToAdd);
          rowToAdd[colIndex].origin = keyOrigin;
          // Lastly, we remove the dataArray attribute from rowToAdd
          delete rowToAdd[colIndex].dataArray;
          tableDataUpdated.push(rowToAdd);
        }
      }
    }

    // The second loop deals with firstDegNeighbours's additions
    for (let i = 0; i < tableData.length; ++i) {
      // We first create a deep copy of the current row
      let curRow = _.cloneDeep(tableData[i]);
      // If the current cell in the selected column does NOT have dataArray attribute
      // We push onto subjectNeighbours and objectNeighbours once
      if (curRow[colIndex].dataArray === undefined) {
        subjectNeighbours.push(firstDegNeighbours["subject"][i]);
        objectNeighbours.push(firstDegNeighbours["object"][i]);
      }
      // Else, we have to push onto subject/objectNeighbours 1 + dataArray.length times.
      else {
        for (let j = 0; j < 1 + curRow[colIndex].dataArray.length; ++j) {
          subjectNeighbours.push(firstDegNeighbours["subject"][i]);
          objectNeighbours.push(firstDegNeighbours["object"][i]);
        }
      }
    }
    let firstDegNeighboursUpdated = 
      {
        "subject":subjectNeighbours,
        "object":objectNeighbours,
      }
    // We take a look at updated tableData and firstDegNeighbours
    // console.log(tableDataUpdated);
    // console.log(firstDegNeighboursUpdated);

    // Now we set up the obj for Action Panel
    // We check if the curActionInfo's task is sameNeighbourAndRecommendation or populateSameNeighbour
    let tempObj = {};
    let curActionInfo = _.cloneDeep(this.state.curActionInfo);

    // If it is sameNeighbourAndRecommendation, we will turn it to populateRecommendation
    if (curActionInfo.task === "sameNeighbourAndRecommendation") {
      tempObj["task"] = "populateRecommendation";
      tempObj["colIndex"] = curActionInfo.colIndex;
      tempObj["recommendArray"] = curActionInfo.recommendArray; 
    }
    // Else, if it is sameNeighbourAndStartRecommend, we will turn it to showStartRecommend
    else if (curActionInfo.task === "sameNeighbourAndStartRecommend") {
      tempObj["task"] = "showStartRecommend";
      tempObj["colIndex"] = curActionInfo.colIndex;
      tempObj["recommendArray"] = curActionInfo.recommendArray; 
    }
    // Else, we turn the current action into afterPopulateColumn
    else {
      tempObj["task"] = "afterPopulateColumn";
    }

    // Support for undo: 
    // Let's save the previous state in an object
    let lastAction = "sameNeighbourDiffRow";
    let prevState = 
      {
        "curActionInfo":this.state.curActionInfo,
        "tableData":this.state.tableData,
        "firstDegNeighbours":this.state.firstDegNeighbours,
      };

    this.setState({
      curActionInfo: tempObj,
      tableData: tableDataUpdated,
      firstDegNeighbours: firstDegNeighboursUpdated,
      lastAction: lastAction,
      prevState: prevState,
    })
  }

  // This function populates all neighbour with the same names in the same columns, if that neighbour has multiple occurences.

  sameNeighbourOneRow(e, colIndex, neighbourArray) {
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
        let curData = "N/A"
        tableData[i][colIndex].data = curData;
        // we still need to set the origin for the cell
        let originToAdd = createNeighbourText(neighbourArray) + ":" + curData;
        let keyOrigin = tableData[i][this.state.keyColIndex].origin.slice();
        keyOrigin.push(originToAdd);
        tableData[i][colIndex].origin = keyOrigin;
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
    // We check if the curActionInfo's task is sameNeighbourAndRecommendation or populateSameNeighbour
    let tempObj = {};
    let curActionInfo = _.cloneDeep(this.state.curActionInfo);

    // If it is sameNeighbourAndRecommendation, we will turn it to populateRecommendation
    if (curActionInfo.task === "sameNeighbourAndRecommendation") {
      tempObj["task"] = "populateRecommendation";
      tempObj["colIndex"] = curActionInfo.colIndex;
      tempObj["recommendArray"] = curActionInfo.recommendArray; 
    }
    // Else, if it is sameNeighbourAndStartRecommend, we will turn it to showStartRecommend
    else if (curActionInfo.task === "sameNeighbourAndStartRecommend") {
      tempObj["task"] = "showStartRecommend";
      tempObj["colIndex"] = curActionInfo.colIndex;
      tempObj["recommendArray"] = curActionInfo.recommendArray; 
    }
    // Else, we turn the current action into afterPopulateColumn
    else {
      tempObj["task"] = "afterPopulateColumn";
    }

    // Support for undo: 
    let lastAction = "sameNeighbourOneRow";
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

  // The following function populates one recommendation neighbour
  // This function should be very similar to populateStartRecommend
  populateRecommendation(e, colIndex, neighbourArray) {
    // console.log(colIndex);
    // console.log(neighbourArray);

    document.body.classList.add('waiting');

    // First thing we need to do should be the same as contextAddColumn
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
    // console.log(tableData);

    // we now take care of tabler header, and selectedClassAnnotation's addition
    let tableHeader = [];
    for (let j = 0; j < colIndex + 1; ++j) {
      tableHeader.push(this.state.tableHeader[j]);
    }
    tableHeader.push([]);
    for (let k = colIndex + 1; k < colNum; ++k) {
      tableHeader.push(this.state.tableHeader[k]);
    }
    // console.log(tableHeader);

    // we now take care of selectedClassAnnotation
    let selectedClassAnnotation = [];
    for (let j = 0; j < colIndex; ++j) {
      selectedClassAnnotation.push(this.state.selectedClassAnnotation[j]);
    }
    selectedClassAnnotation.push([]);
    for (let k = colIndex; k < colNum-1; ++k) {
      selectedClassAnnotation.push(this.state.selectedClassAnnotation[k]);
    }
    // console.log(selectedClassAnnotation);

    // If colIndex is less than keyColIndex, we need to increase keyColIndex by 1
    let keyColIndex = this.state.keyColIndex;
    if (colIndex < keyColIndex) {
      ++keyColIndex;
    }
    // console.log(keyColIndex);

    // Now, the part that's the same as contextAddColumn is over.
    // The part below will be largely the same as populateOtherColumn.

    // An important things for us to do how is to increment colIndex
    ++colIndex;

    // We use a boolean to keep track of if any cell contains multiple values
    let hasMultiple = false;

    for (let i = 0; i < tableData.length; ++i) {
      // curColumnArray is the dataArray for each entry in search column, for all neighbours in neighbourArray.
      let curColumnArray = [];
      // We loop through the neighbourArray
      for (let j = 0; j < neighbourArray.length; ++j) {
        // For each neighbour in neighbourArray, we check to see if entries in search column have values for this neighbour
        let curNeighbour = neighbourArray[j];
        let firstDegNeighbours = 
          curNeighbour.type === "subject" ? this.state.firstDegNeighbours.subject : this.state.firstDegNeighbours.object;
        // console.log(firstDegNeighbours);
        let curNeighbourData = firstDegNeighbours[i][curNeighbour.value];
        // console.log("Current neighbour data is "+curNeighbourData);
        // If yes, we want to concat those values with curColumnArray
        if (curNeighbourData !== undefined) {
          curColumnArray = curColumnArray.concat(curNeighbourData);
        }
      }
      // If curColumnArray is empty, that means this entry in searchColumn do not have any of the attributes from neighbourArray
      if (curColumnArray.length === 0) {
        let curData = "N/A";
        tableData[i][colIndex].data = curData;
        // we still need to set origin for the data to support auto-fill
        let originToAdd = createNeighbourText(neighbourArray) + ":" + curData;
        let keyOrigin = tableData[i][keyColIndex].origin.slice();
        keyOrigin.push(originToAdd);
        tableData[i][colIndex].origin = keyOrigin;
      }
      // Otherwise, we have found at least one value.
      else {
        // we first set the data for the cell using curColumnArray[0]
        tableData[i][colIndex].data = curColumnArray[0];
        // we then set origin for the cell. Need to use neighbourArray to get the correct text for the origin
        let originToAdd = createNeighbourText(neighbourArray) + ":" + curColumnArray[0];
        let keyOrigin = tableData[i][keyColIndex].origin.slice();
        keyOrigin.push(originToAdd);
        tableData[i][colIndex].origin = keyOrigin;
        // console.log(keyOrigin)

        // Now, if curColumnArray has length longer than one, we want to set hasMultiple to true
        // We also create an extra attribute for the current tableData cell, called dataArray, whose max length is maxNeighbourCount.
        if (curColumnArray.length > 1) {
          hasMultiple = true;
          let lastIndex = Math.min(curColumnArray.length, maxNeighbourCount);
          tableData[i][colIndex].dataArray = curColumnArray.slice(1, lastIndex);
        } 
      }
    }
    // Now, we are done with updating tableData.
    // We want to update tableHeader as well.
    tableHeader[colIndex] = neighbourArray;

    // In the third part of the code, We start setting up the content for the Action Panel.

    // First thing we want to do is to update the recommendArray: 
    // We want to remove the recommendation just added from the recommendArray
    let recommendArray = _.cloneDeep(this.state.curActionInfo.recommendArray)
    let curRecommendation = neighbourArray[0];
    let sliceIndex = -1;

    // This for loop checks which index we want to remove
    for (let i = 0; i < recommendArray.length; ++i) {
      if (recommendArray[i].value === curRecommendation.value && recommendArray[i].type === curRecommendation.type) {
        sliceIndex = i;
        break;
      }
    }

    // console.log(sliceIndex);
    // console.log(curRecommendation);
    // console.log(recommendArray);
    
    // This if condition removes the found element
    if (sliceIndex !== -1) {
      recommendArray.splice(sliceIndex, 1);
    }

    // tempObj stores the information passed to ActionPanel
    let tempObj = {};
    // console.log(this.state.curActionInfo);
    if (hasMultiple === true && recommendArray.length > 0) {
      tempObj["task"] = "sameNeighbourAndRecommendation";
      tempObj["colIndex"] = colIndex;
      tempObj["neighbourArray"] = neighbourArray;
      tempObj["recommendArray"] = recommendArray;
    }
    else if (hasMultiple === false && recommendArray.length > 0) {
      tempObj["task"] = "populateRecommendation";
      tempObj["colIndex"] = colIndex;
      tempObj["recommendArray"] = recommendArray;
    }
    else if (hasMultiple === true) {
      tempObj["task"] = "populateSameNeighbour";
      tempObj["colIndex"] = colIndex;
      tempObj["neighbourArray"] = neighbourArray;
    }
    else {
      tempObj["task"] = "afterPopulateColumn"
    }

    // console.log(tableData);
    // console.log(tableHeader);
    // console.log(selectedClassAnnotation);
    // console.log(keyColIndex);
    // console.log(tempObj);

    // Support for updating typeRecord. To do this, we have to first get the typeRecord for the column just added.
    // We first randomly get a number of (Math.min(tableData.length, numForTree)) samples from tableData
    let sampleRows = _.sampleSize(tableData, Math.min(tableData.length, numForTree));
    let promiseArray = getRDFType(sampleRows, colIndex);
    allPromiseReady(promiseArray).then((values) => {
    // In here we call another helper function to store the ontology rdf:type of the sampleRows
    // to support semantic tree
    let curColumnRecord = buildTypeRecord(sampleRows, colIndex, values)
    // we now add the curColumnRecord to typeRecord
    let typeRecord = [];
    for (let j = 0; j < colIndex; ++j) {
      typeRecord.push(this.state.typeRecord[j]);
    }
    typeRecord.push(curColumnRecord);
    for (let k = colIndex; k < colNum; ++k) {
      typeRecord.push(this.state.typeRecord[k]);
    }

    // console.log(typeRecord);

    document.body.classList.remove('waiting');

    // Lastly, we add support for undo, and set the states
    let lastAction = "populateRecommendation";
    let prevState =
      {
        "tableData": this.state.tableData,
        "tableHeader": this.state.tableHeader,
        "curActionInfo": this.state.curActionInfo,
        "keyColIndex": this.state.keyColIndex,
        "selectedClassAnnotation": this.state.selectedClassAnnotation,
        "tabIndex": this.state.tabIndex,
        "previewColIndex": this.state.previewColIndex,
        "typeRecord": this.state.typeRecord,
      } 

    this.setState({
      tableData: tableData,
      tableHeader: tableHeader,
      selectedClassAnnotation: selectedClassAnnotation,
      keyColIndex: keyColIndex,
      curActionInfo: tempObj,
      tabIndex: 0,
      previewColIndex: -1,
      prevState: prevState,
      lastAction: lastAction,
      typeRecord: typeRecord,
    })
    })
  }

  // This function

  createStartRecommend(keyColNeighbours) {
    let recommendArray = [];
    let numRecommend = Math.min(5, keyColNeighbours.length);
    for (let i = 0; i < numRecommend; ++i) {
      recommendArray.push(keyColNeighbours[i]);
    }
    return recommendArray;
  }

  // This function below should mostly be similar to populateRecommendation, with some small differences. 

  populateStartRecommend(e, colIndex, neighbourArray) {
    // console.log(colIndex);
    // console.log(neighbourArray);
    // console.log(this.state.curActionInfo);

    document.body.classList.add('waiting');

    // First thing we need to do should be the same as contextAddColumn
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
    // console.log(tableData);

    // we now take care of tabler header, and selectedClassAnnotation's addition
    let tableHeader = [];
    for (let j = 0; j < colIndex + 1; ++j) {
      tableHeader.push(this.state.tableHeader[j]);
    }
    tableHeader.push([]);
    for (let k = colIndex + 1; k < colNum; ++k) {
      tableHeader.push(this.state.tableHeader[k]);
    }
    // console.log(tableHeader);

    // we now take care of selectedClassAnnotation
    let selectedClassAnnotation = [];
    for (let j = 0; j < colIndex; ++j) {
      selectedClassAnnotation.push(this.state.selectedClassAnnotation[j]);
    }
    selectedClassAnnotation.push([]);
    for (let k = colIndex; k < colNum-1; ++k) {
      selectedClassAnnotation.push(this.state.selectedClassAnnotation[k]);
    }
    // console.log(selectedClassAnnotation);

    // If colIndex is less than keyColIndex, we need to increase keyColIndex by 1
    let keyColIndex = this.state.keyColIndex;
    if (colIndex < keyColIndex) {
      ++keyColIndex;
    }
    // console.log(keyColIndex);

    // Now, the part that's the same as contextAddColumn is over.
    // The part below will be largely the same as populateOtherColumn.

    // An important things for us to do how is to increment colIndex
    ++colIndex;

    // We use a boolean to keep track of if any cell contains multiple values
    let hasMultiple = false;

    for (let i = 0; i < tableData.length; ++i) {
      // curColumnArray is the dataArray for each entry in search column, for all neighbours in neighbourArray.
      let curColumnArray = [];
      // We loop through the neighbourArray
      for (let j = 0; j < neighbourArray.length; ++j) {
        // For each neighbour in neighbourArray, we check to see if entries in search column have values for this neighbour
        let curNeighbour = neighbourArray[j];
        let firstDegNeighbours = 
          curNeighbour.type === "subject" ? this.state.firstDegNeighbours.subject : this.state.firstDegNeighbours.object;
        // console.log(firstDegNeighbours);
        let curNeighbourData = firstDegNeighbours[i][curNeighbour.value];
        // console.log("Current neighbour data is "+curNeighbourData);
        // If yes, we want to concat those values with curColumnArray
        if (curNeighbourData !== undefined) {
          curColumnArray = curColumnArray.concat(curNeighbourData);
        }
      }
      // If curColumnArray is empty, that means this entry in searchColumn do not have any of the attributes from neighbourArray
      if (curColumnArray.length === 0) {
        let curData = "N/A";
        tableData[i][colIndex].data = curData;
        // we still need to set origin so that we can support autofill
        let originToAdd = createNeighbourText(neighbourArray) + ":" + curData;
        let keyOrigin = tableData[i][keyColIndex].origin.slice();
        keyOrigin.push(originToAdd);
        tableData[i][colIndex].origin = keyOrigin;
      }
      // Otherwise, we have found at least one value.
      else {
        // we first set the data for the cell using curColumnArray[0]
        tableData[i][colIndex].data = curColumnArray[0];
        // we then set origin for the cell. Need to use neighbourArray to get the correct text for the origin
        let originToAdd = createNeighbourText(neighbourArray) + ":" + curColumnArray[0];
        let keyOrigin = tableData[i][keyColIndex].origin.slice();
        keyOrigin.push(originToAdd);
        tableData[i][colIndex].origin = keyOrigin;
        // console.log(keyOrigin)

        // Now, if curColumnArray has length longer than one, we want to set hasMultiple to true
        // We also create an extra attribute for the current tableData cell, called dataArray, whose max length is maxNeighbourCount.
        if (curColumnArray.length > 1) {
          hasMultiple = true;
          let lastIndex = Math.min(curColumnArray.length, maxNeighbourCount);
          tableData[i][colIndex].dataArray = curColumnArray.slice(1, lastIndex);
        } 
      }
    }
    // Now, we are done with updating tableData.
    // We want to update tableHeader as well.
    tableHeader[colIndex] = neighbourArray;

    // In the third part of the code, We start setting up the content for the Action Panel.

    // First thing we want to do is to update the recommendArray: 
    // We want to remove the recommendation just added from the recommendArray
    let recommendArray = _.cloneDeep(this.state.curActionInfo.recommendArray)
    let curRecommendation = neighbourArray[0];
    let sliceIndex = -1;

    // This for loop checks which index we want to remove
    for (let i = 0; i < recommendArray.length; ++i) {
      if (recommendArray[i].value === curRecommendation.value && recommendArray[i].type === curRecommendation.type) {
        sliceIndex = i;
        break;
      }
    }

    // console.log(sliceIndex);
    // console.log(curRecommendation);
    // console.log(recommendArray);
    
    // This if condition removes the found element
    if (sliceIndex !== -1) {
      recommendArray.splice(sliceIndex, 1);
    }

    // tempObj stores the information passed to ActionPanel
    let tempObj = {};
    // console.log(this.state.curActionInfo);
    if (hasMultiple === true && recommendArray.length > 0) {
      tempObj["task"] = "sameNeighbourAndStartRecommend";
      tempObj["colIndex"] = colIndex;
      tempObj["neighbourArray"] = neighbourArray;
      tempObj["recommendArray"] = recommendArray;
    }
    else if (hasMultiple === false && recommendArray.length > 0) {
      tempObj["task"] = "showStartRecommend";
      tempObj["colIndex"] = colIndex;
      tempObj["recommendArray"] = recommendArray;
    }
    else if (hasMultiple === true) {
      tempObj["task"] = "populateSameNeighbour";
      tempObj["colIndex"] = colIndex;
      tempObj["neighbourArray"] = neighbourArray;
    }
    else {
      tempObj["task"] = "afterPopulateColumn";
    }

    // Support for updating typeRecord. To do this, we have to first get the typeRecord for the column just added.
    // We first randomly get a number of (Math.min(tableData.length, numForTree)) samples from tableData
    let sampleRows = _.sampleSize(tableData, Math.min(tableData.length, numForTree));
    let promiseArray = getRDFType(sampleRows, colIndex);
    allPromiseReady(promiseArray).then((values) => {
    // In here we call another helper function to store the ontology rdf:type of the sampleRows
    // to support semantic tree
    let curColumnRecord = buildTypeRecord(sampleRows, colIndex, values)
    // we now add the curColumnRecord to typeRecord
    let typeRecord = [];
    for (let j = 0; j < colIndex; ++j) {
      typeRecord.push(this.state.typeRecord[j]);
    }
    typeRecord.push(curColumnRecord);
    for (let k = colIndex; k < colNum; ++k) {
      typeRecord.push(this.state.typeRecord[k]);
    }

    // console.log(tableData);
    // console.log(tableHeader);
    // console.log(selectedClassAnnotation);
    // console.log(keyColIndex);
    // console.log(tempObj);
    // console.log(typeRecord);

    // Lastly, we add support for undo, and set the states

    document.body.classList.remove('waiting');

    let lastAction = "populateStartRecommend";
    let prevState =
      {
        "tableData": this.state.tableData,
        "tableHeader": this.state.tableHeader,
        "curActionInfo": this.state.curActionInfo,
        "keyColIndex": this.state.keyColIndex,
        "selectedClassAnnotation": this.state.selectedClassAnnotation,
        "tabIndex": this.state.tabIndex,
        "previewColIndex": this.state.previewColIndex,
        "typeRecord": this.state.typeRecord,
      } 

    this.setState({
      tableData: tableData,
      tableHeader: tableHeader,
      selectedClassAnnotation: selectedClassAnnotation,
      keyColIndex: keyColIndex,
      curActionInfo: tempObj,
      tabIndex: 0,
      previewColIndex: -1,
      prevState: prevState,
      lastAction: lastAction,
      typeRecord: typeRecord,
    })
    })
  }

  // The following function adds a new column to the table, to the right of the selected column.
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

    // we now take care of tabler header, and selectedClassAnnotation's addition
    let tableHeader = [];
    for (let j = 0; j < colIndex + 1; ++j) {
      tableHeader.push(this.state.tableHeader[j]);
    }
    tableHeader.push([]);
    for (let k = colIndex + 1; k < colNum; ++k) {
      tableHeader.push(this.state.tableHeader[k]);
    }

    // we now take care of selectedClassAnnotation
    let selectedClassAnnotation = [];
    for (let j = 0; j < colIndex + 1; ++j) {
      selectedClassAnnotation.push(this.state.selectedClassAnnotation[j]);
    }
    selectedClassAnnotation.push([]);
    for (let k = colIndex + 1; k < colNum; ++k) {
      selectedClassAnnotation.push(this.state.selectedClassAnnotation[k]);
    }

    // we now take care of typeRecord
    let typeRecord = [];
    for (let j = 0; j < colIndex + 1; ++j) {
      typeRecord.push(this.state.typeRecord[j]);
    }
    typeRecord.push([]);
    for (let k = colIndex + 1; k < colNum; ++k) {
      typeRecord.push(this.state.typeRecord[k]);
    }
    // console.log(typeRecord);

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
          "keyColIndex": this.state.keyColIndex,
          "selectedClassAnnotation": this.state.selectedClassAnnotation,
          "tabIndex": this.state.tabIndex,
          "previewColIndex": this.state.previewColIndex,
          "typeRecord": this.state.typeRecord,
        };

    this.setState({
      tableData: tableData,
      tableHeader: tableHeader,
      curActionInfo: {"task":"afterPopulateColumn"},
      keyColIndex: keyColIndex,
      selectedClassAnnotation: selectedClassAnnotation,
      tabIndex: 0, // we want to set the currently active tab to be wrangling actions
      previewColIndex: -1, // we want to set the preview column index to -1
      lastAction: lastAction,
      prevState: prevState,
      typeRecord: typeRecord,
    });
  }
  
  // The following function handles the deletion of a selected column.
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
      // We handle tableData, tableHeader, optionsMap, selectedClassAnnotation, and typeRecord's deletion
      let tableData = _.cloneDeep(this.state.tableData);
      let tableHeader = this.state.tableHeader.slice();
      let optionsMap = this.state.optionsMap.slice();
      let selectedClassAnnotation = this.state.selectedClassAnnotation.slice();
      let typeRecord = _.cloneDeep(this.state.typeRecord);

      // tableData
      for (let i = 0; i < tableData.length; ++i) {
        tableData[i].splice(colIndex, 1);
      }
      // tableHeader, optionsMap, selectedClassAnnotation, and typeRecord
      tableHeader.splice(colIndex, 1);
      optionsMap.splice(colIndex, 1);
      if (colIndex > 0) {
        selectedClassAnnotation.splice(colIndex-1, 1);
      }
      typeRecord.splice(colIndex, 1);
      // console.log(typeRecord);

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
            "selectedClassAnnotation": this.state.selectedClassAnnotation,
            "keyColIndex": this.state.keyColIndex,
            "previewColIndex": this.state.previewColIndex,
            "propertyNeighbours": this.state.propertyNeighbours,
            "curActionInfo": this.state.curActionInfo,
            "typeRecord": this.state.typeRecord,
          };

      this.setState({
        tableData: tableData,
        tableHeader: tableHeader,
        selectedClassAnnotation: selectedClassAnnotation,
        typeRecord: typeRecord,
        keyColIndex: keyColIndex,
        previewColIndex: -1, // we want to set the preview column index to -1
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
    document.body.classList.add('waiting');
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

    // console.log("Table Data is: ");
    // console.log(tableData);
    // console.log("Search entry is ");
    // console.log(searchEntry);

    // We need a bugfix here: since tableData is reordered, firstColSelection now do not have the correct data anymore.
    // We have to update firstColSelection to include the correct data.
    let promiseArrayOne = this.getNeighbourPromise(tableData, "subject", this.state.keyColIndex);
    let promiseArrayTwo = this.getNeighbourPromise(tableData, "object", this.state.keyColIndex);
    allPromiseReady(promiseArrayOne).then((valuesOne) => {
    allPromiseReady(promiseArrayTwo).then((valuesTwo) => {

      // We call updateNeighbourInfo here because we are changing the rows
      let updatedNeighbours = updateNeighbourInfo(valuesOne, valuesTwo);
      let firstDegNeighbours = updatedNeighbours.firstDegNeighbours;

      document.body.classList.remove('waiting');

      // Support for undo: 
      let lastAction = "contextSortColumn";
      let prevState = 
          {
            "tableData": this.state.tableData,
            "firstDegNeighbours": this.state.firstDegNeighbours,
            "previewColIndex": this.state.previewColIndex,
          };

      this.setState({
        tableData: tableData,
        firstDegNeighbours: firstDegNeighbours,
        previewColIndex: -1,
        lastAction: lastAction,
        prevState: prevState,
      });
    })
    })
  }

  // The following function dedups the selected column.
  // Note: this function has to make modifications to both firstDegNeighbours and keyColNeighbours

  contextDedupColumn(e, colIndex) {
    document.body.classList.add('waiting');
    let tableData = _.cloneDeep(this.state.tableData);
    // console.log(colIndex);
    // console.log(tableData);

    // We simply dedup this column by calling the uniqBy function from the lodash library
    tableData = _.uniqBy(tableData, function(x) {return x[colIndex].data;});
    // console.log(this.state.tableData);
    // console.log(tableData);

    // Now we deal with firstDegNeighbours and keyColNeighbours' updates
    // Since we are changing the number of rows, we need to call updateNeighbourInfo
    // Note: the colIndex we give to getNeighbourPromise should be this.state.keyColIndex
    let promiseArrayOne = this.getNeighbourPromise(tableData, "subject", this.state.keyColIndex);
    let promiseArrayTwo = this.getNeighbourPromise(tableData, "object", this.state.keyColIndex);
    allPromiseReady(promiseArrayOne).then((valuesOne) => {
    allPromiseReady(promiseArrayTwo).then((valuesTwo) => {

      // We call updateNeighbourInfo here because we are changing the rows
      let updatedNeighbours = updateNeighbourInfo(valuesOne, valuesTwo);
      let keyColNeighbours = updatedNeighbours.keyColNeighbours;
      let firstDegNeighbours = updatedNeighbours.firstDegNeighbours;

      document.body.classList.remove('waiting');

      // Support for undo:
      let lastAction = "contextDedupColumn";
      let prevState = 
        {
          "tableData": this.state.tableData,
          "keyColNeighbours": this.state.keyColNeighbours,
          "firstDegNeighbours": this.state.firstDegNeighbours,
          "tabIndex": this.state.tabIndex,
          "previewColIndex": this.state.previewColIndex,
        }

      this.setState({
        tableData: tableData,
        keyColNeighbours: keyColNeighbours,
        firstDegNeighbours: firstDegNeighbours,
        tabIndex: 0,
        previewColIndex: -1,
        lastAction: lastAction,
        prevState: prevState,
      })
    })
    })
  }

  // This function handles click event on the filter icon.
  // We want to let the Action Panel display 4 different filtering methods:
  // 1) Sort ascending
  // 2) Sort descending
  // 3) Filter
  // 4) Dedup

  showFilterMethods(e, colIndex) {
    // console.log("Selected column is "+colIndex);

    // We just need to pass on the colIndex
    let tempObj = {};
    tempObj["task"] = "showFilterMethods";
    tempObj["colIndex"] = colIndex;
    
    this.setState({
      curActionInfo: tempObj,
      tabIndex: 0, // we also want to set the currentlly active tab index to 0
      previewColIndex: -1, // we also want to set preview column index to -1 (clear previews)
    })
  }

  // The following functions sets the selected column to be the search column.

  contextSetColumn(e, colIndex) {

    // console.log("Col index of search cell is "+colIndex);

    // Let's do a preliminary check here to make sure that users do not set empty columns as search columns
    let colEmpty = true;
    for (let i = 0; i < this.state.tableData.length; ++i) {
      if (this.state.tableData[i][colIndex].data !== "") {
        colEmpty = false;
        break;
      }
    }

    // We give users an alert if they try to set an empty columns as the search column
    if (colEmpty === true) {
      alert("This column is currently empty. Try set the data for this column before setting it as the search column.");
    }
    else {
      document.body.classList.add('waiting');

      // Code here should largely be similar to what we have in populateKeyColumn

      let tableData = _.cloneDeep(this.state.tableData);

      // We need to find neighbours of a column.
      // We need to use tableData to ask more queries (number of queries is equal to tableData.length)
      let promiseArrayOne = this.getNeighbourPromise(tableData, "subject", colIndex);
      let promiseArrayTwo = this.getNeighbourPromise(tableData, "object", colIndex);

      allPromiseReady(promiseArrayOne).then((valuesOne) => {
      allPromiseReady(promiseArrayTwo).then((valuesTwo) => {

        // We call updateNeighbourInfo here because we are changing the rows
        let updatedNeighbours = updateNeighbourInfo(valuesOne, valuesTwo);
        let keyColNeighbours = updatedNeighbours.keyColNeighbours;
        let firstDegNeighbours = updatedNeighbours.firstDegNeighbours;

        // Lastly, we set up the information for the action panel
        let tempObj = {};
        tempObj["task"] = "showStartRecommend";
        tempObj["colIndex"] = colIndex;
        tempObj["recommendArray"] = this.createStartRecommend(keyColNeighbours);

        document.body.classList.remove('waiting');

        // Support for undo: 
        let lastAction = "contextSetColumn";
        let prevState = 
            {
              "keyColIndex": this.state.keyColIndex,
              "keyColNeighbours": this.state.keyColNeighbours,
              "firstDegNeighbours": this.state.firstDegNeighbours,
              "curActionInfo": this.state.curActionInfo,
              "tabIndex": this.state.tabIndex,
              "previewColIndex": this.state.previewColIndex,
            };

        this.setState({
          keyColIndex: colIndex,
          keyColNeighbours: keyColNeighbours,
          firstDegNeighbours: firstDegNeighbours,
          curActionInfo: tempObj,
          tabIndex: 0, // we want to set the currently active tab to be wrangling actions
          previewColIndex: -1,
          lastAction: lastAction,
          prevState: prevState,
        });
      })
      })
    }
  }

  // // The following function displays the origin of a cell in the Action Panel.

  // contextCellOrigin(e, rowIndex, colIndex) {
  //   // To get the origin of a cell, we simply returns its "origin field"
  //   // The trick is to set the origin field correctly in previous functions
  //   // The place to do that should be in the two populating columns

  //   let cellSelected = this.state.tableData[rowIndex][colIndex];

  //   let originElement = [];
  //   for (let i = 0; i < cellSelected.origin.length; ++i) {
  //     originElement.push(<p>{niceRender(cellSelected.origin[i])}</p>);
  //   }

  //   // This origin literal correctly contains the cell Origin we want to display
  //   // Now we just need to show it in the ActionPanel
  //   let tempObj = {};
  //   tempObj["task"] = "contextCellOrigin";
  //   tempObj["origin"] = originElement;

  //   // Support for undo: 
  //   let lastAction = "contextCellOrigin";
  //   let prevState = 
  //       {
  //         "curActionInfo": this.state.curActionInfo,
  //         "tabIndex": this.state.tabIndex,
  //       };
    
  //   this.setState({
  //     curActionInfo: tempObj,
  //     tabIndex: 0, // we want to set the currently active tab to be wrangling actions
  //     lastAction: lastAction,
  //     prevState: prevState,
  //   });
  // }

  // This function has three functionalities: 
  // Show the selected cell's origin, show the selected cell's preview, and update the bottom iframe's URL

  originPreviewPage(e, rowIndex, colIndex) {
    document.body.classList.add('waiting');
    // console.log("Row index is "+rowIndex);
    // console.log("Col index is "+colIndex);

    // This first part deals with preview

    // Let's first run queries to fetch the dbp neighbours and dbo neighbours for the selected cell (withe some filtering)
    // In here, we need both the ?p and ?o. This is different from before.

    let promiseArray = [];

    // Below is the first query we will make. In here we are using the tableCell as SUBJECT

    // select ?p ?o
    // where {
    // dbr:Barack_Obama ?p ?o.
    // }

    let prefixURLOne = 
      "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    let suffixURLOne = 
      "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    let queryBodyOne = 
      "select+%3Fp+%3Fo%0D%0Awhere+%7B%0D%0Adbr%3A" + 
      regexReplace(this.state.tableData[rowIndex][colIndex].data) +
      "+%3Fp+%3Fo.%0D%0A%7D&";
    let queryURLOne = prefixURLOne + queryBodyOne + suffixURLOne;
    let otherColPromiseSubject = fetchJSON(queryURLOne);
    promiseArray.push(otherColPromiseSubject);

    // Below is the second query we will make. In here we are using the tableCell as OBJECT.

    // select ?p ?o
    // where {
    // ?o ?p dbr:Barack_Obama.
    // }

    let prefixURLTwo = 
      "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
    let suffixURLTwo = 
      "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
    let queryBodyTwo =
      "select+%3Fp+%3Fo%0D%0Awhere+%7B%0D%0A%3Fo+%3Fp+dbr%3A" +
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

      // // Modified on August 28th: when we double click a cell in the first column, and the first column is the current search column
      // // We want to update firstColSelection and firstColChecked as well
      // let firstColSelection = _.cloneDeep(this.state.firstColSelection);
      // let firstColChecked = _.cloneDeep(this.state.firstColChecked);

      // if (this.state.keyColIndex === 0 && colIndex === 0) {
      //   // We first update firstColSelection
      //   console.log(values[0].results.bindings);
      //   firstColSelection = updateFirstColSelection(values[0].results.bindings);
      //   // We then update firstColChecked
      //   firstColChecked = [];
      //   for (let i = 0; i < firstColSelection.length; ++i) {
      //     firstColChecked.push(false);
      //   }
      // }
      
      // Here is where we make the modifications: instead of passing information to Action Panel, let's store them as states
      let previewInfoArray = subjectInfoArray.concat(objectInfoArray);
      let previewInfoExpanded = [];
      for (let i = 0; i < previewInfoArray.length; ++i) {
        previewInfoExpanded.push(false);
      }
      let selectedCell = _.cloneDeep(this.state.tableData[rowIndex][colIndex]);
      let iframeURL = "https://en.wikipedia.org/wiki/" + this.state.tableData[rowIndex][colIndex].data;

      let tempObj = {};
      tempObj["task"] = "originPreviewPage";

      // Support for undo: 
      document.body.classList.remove('waiting');
      let lastAction = "originPreviewPage";
      let prevState = 
          {
            "curActionInfo": this.state.curActionInfo,
            "tabIndex": this.state.tabIndex,
            "pageHidden": this.state.pageHidden,
            "iframeURL": this.state.iframeURL,
            "previewInfoArray": this.state.previewInfoArray,
            "previewInfoExpanded": this.state.previewInfoExpanded,
            "selectedCell": this.state.selectedCell,
            "previewColIndex": this.state.previewColIndex,
            // "firstColSelection": this.state.firstColSelection,
            // "firstColChecked": this.state.firstColChecked,
          };
      
      this.setState({
        curActionInfo: tempObj,
        tabIndex: 0, // we want to set the currently active tab to be wrangling actions
        previewColIndex: -1,
        pageHidden: false,
        iframeURL: iframeURL,
        previewInfoArray: previewInfoArray,
        previewInfoExpanded: previewInfoExpanded,
        selectedCell: selectedCell,
        // firstColSelection: firstColSelection, // updated on 9/13
        // firstColChecked: firstColChecked, // updated on 9/13
        lastAction: lastAction,
        prevState: prevState,
      });
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
    this.setState({
      tableOpenList: tableOpenList,
    });
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
    // Also note that since table headers can be multi-selects, each tableHeader element is in the form of a length one array
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
      let minLength = Math.min(tableDataExplore[i].length, tableHeader.length);
      for (let j=0;j<minLength;++j) {
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
      
      // We call updateNeighbourInfo here because we are changing the rows
      let updatedNeighbours = updateNeighbourInfo(valuesOne, valuesTwo);
      let keyColNeighbours = updatedNeighbours.keyColNeighbours;
      let firstDegNeighbours = updatedNeighbours.firstDegNeighbours;

      return Promise.resolve(
        {
          "keyColIndex":keyColIndex,
          "tableHeader":tableHeader,
          "tableData":tableData,
          "keyColNeighbours":keyColNeighbours,
          "firstDegNeighbours":firstDegNeighbours,
        }
      )
    })
    })
  }

  // The following function handles the selection of table.

  handleStartTable(e, tableIndex) {
    document.body.classList.add('waiting');
    
    // We need to let table panel display the selected table
    // And we need to update the Action Panel to display the first degree properties of the original page
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
      urlReplace(decodeURIComponent(this.state.urlPasted.slice(30))) +
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
      urlReplace(decodeURIComponent(this.state.urlPasted.slice(30))) +
      "+dct%3Asubject+%3Fo%0D%0A%7D&";
    let queryURLTwo = prefixURLTwo + queryBodyTwo + suffixURLTwo;
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
          
          // Now we add support for the semantic trees
          // First take a look at tableData
          // console.log(stateInfo.tableData);

          // We sample rows from the table. Note that we need a semantic tree for every column
          // Except the first (since the first column is OriginURL)
          let sampleRows = _.sampleSize(stateInfo.tableData, Math.min(stateInfo.tableData.length, numForTree));
          let promiseArray = getRDFType(sampleRows, -1, "startTable");

          allPromiseReady(promiseArray).then((values) => {

          // In here we call another helper function to store the ontology rdf:type of the sampleRows
          // to support semantic tree
          let typeRecord = buildTypeRecord(sampleRows, -1, values, "startTable");
          // console.log(typeRecord);

          // Lastly, we set up the information for the action panel
          let tempObj = {};
          tempObj["task"] = "showStartRecommend";
          tempObj["colIndex"] = stateInfo.keyColIndex;
          tempObj["recommendArray"] = this.createStartRecommend(stateInfo.keyColNeighbours);

          document.body.classList.remove('waiting');
          // Support for undo: 
          let lastAction = "handleStartTable";
          let prevState = 
              {
                "firstColFilled": this.state.firstColFilled,
                "selectedTableIndex": this.state.selectedTableIndex,
                "propertyNeighbours": this.state.propertyNeighbours,
                "curActionInfo": this.state.curActionInfo,
                "selectedClassAnnotation": this.state.selectedClassAnnotation,
                "keyColIndex": this.state.keyColIndex,
                "keyColNeighbours": this.state.keyColNeighbours,
                "firstDegNeighbours": this.state.firstDegNeighbours,
                "tableData": this.state.tableData,
                "tableHeader": this.state.tableHeader,
                "usecaseSelected": this.state.usecaseSelected,
                "tabIndex": this.state.tabIndex,
                "typeRecord": this.state.typeRecord,
              };

          this.setState({
            firstColFilled: true,
            selectedTableIndex: tableIndex,
            propertyNeighbours: propertyNeighbours,
            // curActionInfo: {"task":"afterPopulateColumn"},
            curActionInfo: tempObj, // Changed on Aug 20th
            selectedClassAnnotation: selectedClassAnnotation,
            keyColIndex: stateInfo.keyColIndex,
            keyColNeighbours: stateInfo.keyColNeighbours,
            firstDegNeighbours: stateInfo.firstDegNeighbours,
            tableData: stateInfo.tableData,
            tableHeader: stateInfo.tableHeader,
            usecaseSelected: "startTable",
            tabIndex: 1,
            lastAction: lastAction,
            prevState: prevState,
            typeRecord: typeRecord,
          });
          });
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

  unionTable(firstIndex, secondIndex, otherTableHTML, colMapping) {
    document.body.classList.add('waiting');
    // First we create a copy of the current tableData
    let tableData = _.cloneDeep(this.state.tableData);
    // console.log(tableData);

    // Starting here, let's build the semantic tree from type record.
    // Let's write a helper function to get the type lineage for each column in the table
    // Note that we have to put tableTreePromise in an array here so that allPromiseReady can work
    let tablePromise = [tableTreePromise(this.state.typeRecord)];
    // console.log(tablePromise);
    allPromiseReady(tablePromise).then((treeValues) => {
    let tableTree = buildTableTree(treeValues[0], this.state.typeRecord);
    // console.log(tableTree);

    // Then we get the clean data and set the origin for the other table.
    // We do so by calling setTableFromHTML, and setUnionData.
    let otherTableOrigin = this.state.propertyNeighbours[firstIndex].siblingArray[secondIndex].name;
    let otherTableData = setTableFromHTML(otherTableHTML, otherTableOrigin);
    otherTableData = setUnionData(otherTableData);
    // console.log(otherTableData);

    // Note that we also need to build a semantic tree for the table being unioned
    // To do that, we first get its typeRecord

    // We sample rows from the otherTableData. 
    // Note that we skip the first column in otherTableData (since the first column is OriginURL)
    let sampleRows = _.sampleSize(otherTableData, Math.min(otherTableData.length, numForTree));
    let promiseArray = getRDFType(sampleRows, -1, "startTable");
    allPromiseReady(promiseArray).then((values) => {
    // We call helper function to store the ontology rdf:type of the sampleRows to support semantic tree
    let otherTypeRecord = buildTypeRecord(sampleRows, -1, values, "startTable");
    // Now we build the semantic tree for the other table from otherTypeRecord
    let otherTablePromise = [tableTreePromise(otherTypeRecord)];
    // console.log(tablePromise);
    allPromiseReady(otherTablePromise).then((otherTreeValues) => {
    let otherTableTree = buildTableTree(otherTreeValues[0], otherTypeRecord);

    // We now take a look at both tableTree and otherTableTree
    // console.log(tableTree);
    // console.log(otherTableTree);

    // Start here

    // We first union by row names, then union by semTree
    
    // Step One: get the column names of the table in the table panel, using this.state.tableHeader.
    let originCols = [];
    let tableHeader = _.cloneDeep(this.state.tableHeader);

    for (let j = 0; j < this.state.tableHeader.length; ++j) {
      let curValue = ""
      for (let k = 0; k < tableHeader[j].length; ++k) {
        curValue+=tableHeader[j][k].value;
      }
      originCols.push(curValue);
    }
    console.log(originCols);

    // Step Two: get the column names of the othe table, based on otherTableHTML
    let newCols = ["OriginURL"];
    let curHeaderCells = otherTableHTML.rows[0].cells;
  
    for (let j = 0; j < curHeaderCells.length; ++j) {
      let headerName = HTMLCleanCell(curHeaderCells[j].innerText);
      newCols.push(headerName);
    }
    console.log(newCols);

    // Note: we have to create a copy of colMapping, otherwise we are modifying the reference

    // console.log(colMapping);

    let tempMapping = colMapping.slice();
    tableData = tableConcat(
      tableData,
      otherTableData,
      tempMapping
    );

    // console.log(tableData);

    // Now, since we are changing the number of rows, we need to call updateNeighbourInfo
    // Note: the colIndex we give to getNeighbourPromise should be this.state.keyColIndex
    let promiseArrayOne = this.getNeighbourPromise(tableData, "subject", this.state.keyColIndex);
    let promiseArrayTwo = this.getNeighbourPromise(tableData, "object", this.state.keyColIndex);
    allPromiseReady(promiseArrayOne).then((valuesOne) => {
    allPromiseReady(promiseArrayTwo).then((valuesTwo) => {

      // We call updateNeighbourInfo here because we are changing the rows
      let updatedNeighbours = updateNeighbourInfo(valuesOne, valuesTwo);
      let keyColNeighbours = updatedNeighbours.keyColNeighbours;
      let firstDegNeighbours = updatedNeighbours.firstDegNeighbours;

      document.body.classList.remove('waiting');
      // Suppport for undo.
      let lastAction = "unionTable";
      let prevState = 
          {
            "tableData":this.state.tableData,
            "keyColNeighbours":this.state.keyColNeighbours,
            "firstDegNeighbours":this.state.firstDegNeighbours,
            "previewColIndex": this.state.previewColIndex,
          };
      
      this.setState({
        tableData: tableData,
        keyColNeighbours: keyColNeighbours,
        firstDegNeighbours: firstDegNeighbours,
        previewColIndex: -1,
        lastAction: lastAction,
        prevState: prevState,
      })
    })
    })
    })
    })
    })
  }

  // The following function unions all similar tables found under a sibling page with the selected table
  unionPage(firstIndex, secondIndex) {
    document.body.classList.add('waiting');
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
    // Now, since we are changing the number of rows, we need to call updateNeighbourInfo
    // Note: the colIndex we give to getNeighbourPromise should be this.state.keyColIndex
    let promiseArrayOne = this.getNeighbourPromise(tableData, "subject", this.state.keyColIndex);
    let promiseArrayTwo = this.getNeighbourPromise(tableData, "object", this.state.keyColIndex);
    allPromiseReady(promiseArrayOne).then((valuesOne) => {
    allPromiseReady(promiseArrayTwo).then((valuesTwo) => {

      // We call updateNeighbourInfo here because we are changing the rows
      let updatedNeighbours = updateNeighbourInfo(valuesOne, valuesTwo);
      let keyColNeighbours = updatedNeighbours.keyColNeighbours;
      let firstDegNeighbours = updatedNeighbours.firstDegNeighbours;

      document.body.classList.remove('waiting');
      // Suppport for undo.
      let lastAction = "unionPage";
      let prevState = 
          {
            "tableData":this.state.tableData,
            "keyColNeighbours":this.state.keyColNeighbours,
            "firstDegNeighbours":this.state.firstDegNeighbours,
            "previewColIndex": this.state.previewColIndex,
          };
      
      this.setState({
        tableData: tableData,
        keyColNeighbours: keyColNeighbours,
        firstDegNeighbours: firstDegNeighbours,
        previewColIndex: -1,
        lastAction: lastAction,
        prevState: prevState,
      })
    })
    })
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
      checkAll: true,   // we want to set checkAll to true whenever we open the filter modal
      curFilterIndex: colIndex,
    })
  }

  // This function handles cancelling the filter (so we close it).
  // In here, we will clean every state related to filtering

  cancelFilter(e) {
    this.setState({
      dataAndChecked: [],
      showFilter: false,
      curFilterIndex: -1,
      filterMin: null,
      filterMax: null,
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

  // This function handles toggling the Check/Uncheck all checkbox in filter modal.

  toggleAll(e) {
    let checkAll = this.state.checkAll;
    let dataAndChecked = this.state.dataAndChecked;
    checkAll = !checkAll;
    // Now we loop through dataAndChecked to set all the checked attribute
    for (let i = 0; i < dataAndChecked.length; ++i) {
      dataAndChecked[i].checked = checkAll;
    }
    this.setState({
      checkAll: checkAll,
      dataAndChecked: dataAndChecked,
    })
  }

  // This function handles applying the filter to tableData, based on dataAndChecked

  applyFilter(e) {
    // console.log(this.state.dataAndChecked);
    // console.log(this.state.curFilterIndex);
    // console.log("Column to filter is "+this.state.curFilterIndex);

    // The following part are added for debugging purposes
    let allFalse = true;
    for (let i = 0; i < this.state.dataAndChecked.length; ++i) {
      if (this.state.dataAndChecked[i].checked === true) {
        allFalse = false;
        break;
      }
    }

    // console.log(this.state.filterMin);
    // console.log(this.state.filterMax);

    // We do not want users to toggle every value off
    if (allFalse === true) {
      alert("Please do not remove every value from the table!");
    }
    // In here we check if user has inputted some kidn of range filter values 
    else if (this.state.filterMin !== null || this.state.filterMax !== null) {
      // We first get the min and max values 
      let filterMin;
      let filterMax;
      if (this.state.filterMin === null) {
        filterMin = Number.NEGATIVE_INFINITY;
        filterMax = Number(this.state.filterMax);
      }
      else if (this.state.filterMax === null) {
        filterMin = Number(this.state.filterMin);
        filterMax = Number.POSITIVE_INFINITY;
      }
      else {
        filterMin = Number(this.state.filterMin);
        filterMax = Number(this.state.filterMax);
      }
      // Now we begin the filtering
      let tableData = _.cloneDeep(this.state.tableData);
      for (let i=0;i<tableData.length;++i) {
        let curNumData = Number(tableData[i][this.state.curFilterIndex].data);
        if (isNaN(curNumData) || curNumData > filterMax || curNumData < filterMin) {
          tableData.splice(i,1);
          --i;
        }
      }

      // Now, since we are changing the number of rows, we need to call updateNeighbourInfo
      // Note: the colIndex we give to getNeighbourPromise should be this.state.keyColIndex
      let promiseArrayOne = this.getNeighbourPromise(tableData, "subject", this.state.keyColIndex);
      let promiseArrayTwo = this.getNeighbourPromise(tableData, "object", this.state.keyColIndex);

      // Now we add support for the semantic trees
      // First take a look at tableData
      // console.log(tableData);

      // We sample rows from the table. Note that we need a semantic tree for every column
      // Except the first (since the first column is OriginURL)
      let sampleRows = _.sampleSize(tableData, Math.min(tableData.length, numForTree));
      let promiseArray = getRDFType(sampleRows, -1, this.state.usecaseSelected);

      allPromiseReady(promiseArray).then((values) => {
      
      allPromiseReady(promiseArrayOne).then((valuesOne) => {
      allPromiseReady(promiseArrayTwo).then((valuesTwo) => {

        // We call updateNeighbourInfo here because we are changing the rows
        let updatedNeighbours = updateNeighbourInfo(valuesOne, valuesTwo);
        let keyColNeighbours = updatedNeighbours.keyColNeighbours;
        let firstDegNeighbours = updatedNeighbours.firstDegNeighbours;

        // In here we call another helper function to store the ontology rdf:type of the sampleRows
        // to support semantic tree
        let typeRecord = buildTypeRecord(sampleRows, -1, values, this.state.usecaseSelected);
        // console.log(typeRecord);

        // Suppport for undo.
        let lastAction = "applyFilter";
        let prevState = 
            {
              "tableData":this.state.tableData,
              "curActionInfo":this.state.curActionInfo,
              "keyColNeighbours":this.state.keyColNeighbours,
              "firstDegNeighbours":this.state.firstDegNeighbours,
              "previewColIndex": this.state.previewColIndex,
              "typeRecord": this.state.typeRecord,
            };
        
        this.setState({
          dataAndChecked: [],
          showFilter: false,
          curFilterIndex: -1,
          filterMin: null,
          filterMax: null,
          tableData: tableData,
          keyColNeighbours: keyColNeighbours,
          firstDegNeighbours: firstDegNeighbours,
          previewColIndex: -1,
          lastAction: lastAction,
          prevState: prevState,
          typeRecord: typeRecord,
        })
      })
      })
      })
    }
    // This else clause contains the original function body (filter by checking boxes)
    else {
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

      // Now, since we are changing the number of rows, we need to call updateNeighbourInfo
      // Note: the colIndex we give to getNeighbourPromise should be this.state.keyColIndex
      let promiseArrayOne = this.getNeighbourPromise(tableData, "subject", this.state.keyColIndex);
      let promiseArrayTwo = this.getNeighbourPromise(tableData, "object", this.state.keyColIndex);

      // Now we add support for the semantic trees
      // First take a look at tableData
      // console.log(tableData);

      // We sample rows from the table. Note that we need a semantic tree for every column
      // Except the first (since the first column is OriginURL)
      let sampleRows = _.sampleSize(tableData, Math.min(tableData.length, numForTree));
      let promiseArray = getRDFType(sampleRows, -1, this.state.usecaseSelected);

      allPromiseReady(promiseArray).then((values) => {
      allPromiseReady(promiseArrayOne).then((valuesOne) => {
      allPromiseReady(promiseArrayTwo).then((valuesTwo) => {

        // We call updateNeighbourInfo here because we are changing the rows
        let updatedNeighbours = updateNeighbourInfo(valuesOne, valuesTwo);
        let keyColNeighbours = updatedNeighbours.keyColNeighbours;
        let firstDegNeighbours = updatedNeighbours.firstDegNeighbours;

        // In here we call another helper function to store the ontology rdf:type of the sampleRows
        // to support semantic tree
        let typeRecord = buildTypeRecord(sampleRows, -1, values, this.state.usecaseSelected);
        // console.log(typeRecord);

        // Suppport for undo.
        let lastAction = "applyFilter";
        let prevState = 
            {
              "tableData":this.state.tableData,
              "curActionInfo":this.state.curActionInfo,
              "keyColNeighbours":this.state.keyColNeighbours,
              "firstDegNeighbours":this.state.firstDegNeighbours,
              "previewColIndex": this.state.previewColIndex,
              "typeRecord": this.state.typeRecord,
            };
        
        this.setState({
          dataAndChecked: [],
          showFilter: false,
          curFilterIndex: -1,
          filterMin: null,
          filterMax: null,
          tableData: tableData,
          keyColNeighbours: keyColNeighbours,
          firstDegNeighbours: firstDegNeighbours,
          previewColIndex: -1,
          lastAction: lastAction,
          prevState: prevState,
          typeRecord: typeRecord,
        })
      })
      })
      })
    }
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

  // This function handles user changing min/max values for range filters
  handleRangeFilter(e, type) {
    e.preventDefault();
    if (type === "min") {
      this.setState({
        filterMin: e.target.value,
      })
    } else {
      this.setState({
        filterMax: e.target.value,
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
        lastAction: "",
      })
    }

    // Case 2: Undo the selection of the task: startSubject.
    // In this case we need to restore usecaseSelected, tableData, firstColSelection, firstColChecked, tabIndex, and curActionInfo

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
        firstColFilled: prevState.firstColFilled,
        selectedTableIndex: prevState.selectedTableIndex,
        propertyNeighbours: prevState.propertyNeighbours,
        curActionInfo: prevState.curActionInfo,
        selectedClassAnnotation: prevState.selectedClassAnnotation,
        keyColIndex: prevState.keyColIndex,
        keyColNeighbours: prevState.keyColNeighbours,
        firstDegNeighbours: prevState.firstDegNeighbours,
        tableData: prevState.tableData,
        tableHeader: prevState.tableHeader,
        usecaseSelected: prevState.usecaseSelected,
        tabIndex: prevState.tabIndex,
        lastAction: "",
      })
    }

    // Case 4: Undo the population of key column.
    // In this case we need to restore keyColIndex, keyColNeighbours, firstDegNeighbours, firstColFilled, 
    //                                 curActionInfo, tableData, tableHeader

    else if (lastAction === "populateKeyColumn") {
      this.setState({
        keyColIndex: prevState.keyColIndex,
        keyColNeighbours: prevState.keyColNeighbours,
        firstDegNeighbours: prevState.firstDegNeighbours,
        curActionInfo: prevState.curActionInfo,
        tableData: prevState.tableData,
        tableHeader: prevState.tableHeader,
        firstColFilled: prevState.firstColFilled,
        firstColHeaderInfo: prevState.firstColHeaderInfo,
        firstColSelection: prevState.firstColSelection,
        firstColChecked: prevState.firstColChecked,
        lastAction: "",
      })
    }

    // Case 5: Undo the population of a new column.
    // In this case we need to restore curActionInfo, tableData.
    else if (lastAction === "populateOtherColumn") {
      this.setState({
        curActionInfo: prevState.curActionInfo,
        tableData: prevState.tableData,
        tableHeader: prevState.tableHeader,
        previewColIndex: prevState.previewColIndex,
        otherColText: prevState.otherColText,
        lastAction: "",
      })
    }

    // Case 6: Undo the population of same neighbour in different columns.
    // In this case we need to restore curActionInfo, tableData, tableHeader, optionsMap.
    else if (lastAction === "sameNeighbourDiffRow") {
      this.setState({
        curActionInfo: prevState.curActionInfo,
        tableData: prevState.tableData,
        firstDegNeighbours: prevState.firstDegNeighbours,
        lastAction: "",
      })
    }

    // Case 7: Undo the population of same neighbour in the same column.
    // In this case we need to restore the curActionInfo, tableData.
    else if (lastAction === "sameNeighbourOneRow") {
      this.setState({
        curActionInfo: prevState.curActionInfo,
        tableData: prevState.tableData,
        lastAction: "",
      })
    }

    // Case 9: Undo the union of tables.
    // In this case we need to restore tableData
    else if (lastAction === "unionTable" || lastAction === "unionPage" || lastAction === "unionProperty") {
      this.setState({
        tableData: prevState.tableData,
        keyColNeighbours: prevState.keyColNeighbours,
        firstDegNeighbours: prevState.firstDegNeighbours,
        previewColIndex: prevState.previewColIndex,
        lastAction: "",
      })
    }

    // Case 10: Undo the addition of a new column
    else if (lastAction === "contextAddColumn") {
      this.setState({
        tableData: prevState.tableData,
        tableHeader: prevState.tableHeader,
        curActionInfo: prevState.curActionInfo,
        keyColIndex: prevState.keyColIndex,
        previewColIndex: prevState.previewColIndex,
        selectedClassAnnotation: prevState.selectedClassAnnotation,
        tabIndex: prevState.tabIndex,
        lastAction: "",
      })
    }

    // Case 11: Undo the set of search cell.
    else if (lastAction === "contextSetColumn") {
      this.setState({
        keyColIndex: prevState.keyColIndex,
        keyColNeighbours: prevState.keyColNeighbours,
        firstDegNeighbours: prevState.firstDegNeighbours,
        curActionInfo: prevState.curActionInfo,
        tabIndex: prevState.tabIndex,
        previewColIndex: prevState.previewColIndex,
        lastAction: "",
      })
    }

    // // Case 12: Undo the showing of cell origin.
    // else if (lastAction === "contextCellOrigin") {
    //   this.setState({
    //     curActionInfo: prevState.curActionInfo,
    //     tabIndex: prevState.tabIndex,
    //     lastAction: "",
    //   })
    // }

    // Case 12: Undo the showing of cell preview.
    else if (lastAction === "originPreviewPage") {
      this.setState({
        curActionInfo: prevState.curActionInfo,
        tabIndex: prevState.tabIndex,
        pageHidden: prevState.pageHidden,
        iframeURL: prevState.iframeURL,
        previewInfoArray: prevState.previewInfoArray,
        previewInfoExpanded: prevState.previewInfoExpanded,
        selectedCell: prevState.selectedCell,
        previewColIndex: prevState.previewColIndex,
        // firstColSelection: prevState.firstColSelection,
        // firstColChecked: prevState.firstColChecked,
        lastAction: "",
      })
    }

    // Case 13: Undo the deletion of column.
    else if (lastAction === "contextDeleteColumn") {
      this.setState({
        tableData: prevState.tableData,
        tableHeader: prevState.tableHeader,
        selectedClassAnnotation: prevState.selectedClassAnnotation,
        keyColIndex: prevState.keyColIndex,
        previewColIndex: prevState.previewColIndex,
        propertyNeighbours: prevState.propertyNeighbours,
        curActionInfo: prevState.curActionInfo,
        lastAction: "",
      })
    }

    // Case 14: Undo the sorting of a column.
    else if (lastAction === "contextSortColumn") {
      this.setState({
        tableData: prevState.tableData,
        firstDegNeighbours: prevState.firstDegNeighbours,
        previewColIndex: prevState.previewColIndex,
        lastAction: "",
      })
    }

    // Case 14: Undo the deduping of a column.
    else if (lastAction === "contextDedupColumn") {
      this.setState({
        tableData: prevState.tableData,
        keyColNeighbours: prevState.keyColNeighbours,
        firstDegNeighbours: prevState.firstDegNeighbours,
        curActionInfo: prevState.curActionInfo,
        tabIndex: prevState.tabIndex,
        previewColIndex: prevState.previewColIndex,
        lastAction: "",
      })
    }

    // Case 15: Undo the row filtering based on column filters.
    else if (lastAction === "applyFilter") {
      this.setState({
        tableData: prevState.tableData,
        keyColNeighbours: prevState.keyColNeighbours,
        firstDegNeighbours: prevState.firstDegNeighbours,
        curActionInfo: prevState.curActionInfo,
        previewColIndex: prevState.previewColIndex,
        lastAction: "",
      })
    }

    // Case 16: Undo the joining of two tables.
    else if (lastAction === "runJoin") {
      this.setState({
        curActionInfo: prevState.curActionInfo,
        tableData: prevState.tableData,
        tableHeader: prevState.tableHeader,
        keyColNeighbours: prevState.keyColNeighbours,
        previewColIndex: prevState.previewColIndex,
        firstDegNeighbours: prevState.firstDegNeighbours,
        selectedClassAnnotation: prevState.selectedClassAnnotation,
        lastAction: "",
      })
    }

    else if (lastAction === "confirmAddFirstCol") {
      this.setState({
        tableData: prevState.tableData,
        firstDegNeighbours: prevState.firstDegNeighbours,
        keyColNeighbours: prevState.keyColNeighbours,
        firstColHeaderInfo: prevState.firstColHeaderInfo,
        previewColIndex: prevState.previewColIndex,
        firstColSelection: prevState.firstColSelection, // updated on 9/13
        firstColChecked: prevState.firstColChecked,  // updated on 9/13
        lastAction: "",
      })
    }

    else if (lastAction === "toggleOtherNeighbour") {
      this.setState({
        tableData: prevState.tableData,
        previewColIndex: prevState.previewColIndex,
        otherColChecked: prevState.otherColChecked,
        otherColCheckedIndex: prevState.otherColCheckedIndex,
        lastAction: "",
      })
    }

    else if (lastAction === "populateRecommendation") {
      this.setState({
        tableData: prevState.tableData,
        tableHeader: prevState.tableHeader,
        keyColIndex: prevState.keyColIndex,
        selectedClassAnnotation: prevState.selectedClassAnnotation,
        curActionInfo: prevState.curActionInfo,
        tabIndex: prevState.tabIndex,
        previewColIndex: prevState.previewColIndex,
        lastAction: "",
      })
    }

    else if (lastAction === "populateStartRecommend") {
      this.setState({
        tableData: prevState.tableData,
        tableHeader: prevState.tableHeader,
        keyColIndex: prevState.keyColIndex,
        selectedClassAnnotation: prevState.selectedClassAnnotation,
        curActionInfo: prevState.curActionInfo,
        tabIndex: prevState.tabIndex,
        previewColIndex: prevState.previewColIndex,
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
    // console.log(tableHeader);
    // Let's loop through this tableHeader to fill the originTableHeader
    for (let i = 0; i < tableHeader.length; ++i) {
      // If the current element in table header has length of 0, it means it's empty
      if (tableHeader[i].length === 0) {
        break;
      }
      else {
        // We loop through the tableHeader[i]
        let value = "";
        for (let j = 0; j < tableHeader[i].length; ++j) {
          let valueToAdd = j > 0 ? "&" + tableHeader[i][j].value : tableHeader[i][j].value;
          value+=valueToAdd;
        }
        originTableHeader.push(
          {
            "value":value,
            "label":value,
            "index":i
          }
        )
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
    // Now we use these to update states, so that join modal can display the right content.

    // Bugfix here: if either tableHeader is empty, we want to show an alert message
    if (originTableHeader.length === 0 || joinTableHeader.length === 0) {
      alert("One of the join tables have no data. Join cannot be performed.");
    }
    else {
      // Support for join suggestions starts here: 
      // we compute the three most joinable column pairs based on column data
      // console.log(this.state.tableData);
      // console.log(joinTableData);

      // We call the helper function computeJoinableColumn that takes in the table data and headers

      let joinPairRecord = computeJoinableColumn(this.state.tableData, joinTableData, originTableHeader, joinTableHeader);

      this.setState({
        showJoinModal: true,
        joinTableIndex: i,
        joinTableData: joinTableData,
        originColOptions: originTableHeader,
        joinColOptions: joinTableHeader,
        joinPairRecord: joinPairRecord,
      })
    }
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

  // Note: it also supports users directly clicks on one of the join suggestions
  runJoin(e, method, originIndex, joinIndex) {
    // First check all the info that we needed
    let joinTableData = this.state.joinTableData.slice();
    let originJoinIndex = "";
    let joinJoinIndex = "";
    if (method === "custom") {
      originJoinIndex = this.state.originJoinIndex;
      joinJoinIndex = this.state.joinJoinIndex;
    }
    else {
      originJoinIndex = originIndex;
      joinJoinIndex = joinIndex;
    }
    // console.log(joinTableData);
    // console.log("Column to join from original table is "+originJoinIndex);
    // console.log("Column to join from new tabel is "+joinJoinIndex);
    
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
    // Now we push on the new columns. Note that it has to be in the form of an array
    for (let i = 0; i < joinTableData[0].length; ++i) {
      if (i !== joinJoinIndex) {
        tableHeaderUpdated.push(
          [
            {
              "value":joinTableData[0][i].data,
              "label":joinTableData[0][i].data
            }
          ]
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
      // console.log("Current entry to join is "+curJoinEntry);
      let curEntryFound = false;
      // We start the index from 1 because the first column in joinTableData is the header
      for (let j = 0; j < joinTableDataUpdated.length; ++j) {
        if (joinTableDataUpdated[j][joinJoinIndex].data === curJoinEntry) {
          // console.log("A match has been found at index "+j);
          // Let's create the tempRow that we want to push onto tableDataUpdated

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

    let promiseArrayOne = this.getNeighbourPromise(tableDataUpdated, "subject", this.state.keyColIndex);
    let promiseArrayTwo = this.getNeighbourPromise(tableDataUpdated, "object", this.state.keyColIndex);

    // Now we add support for the semantic trees
    // First take a look at tableDataUpdated
    // console.log(tableDataUpdated);

    // We sample rows from the table. Note that we need a semantic tree for every column
    // Except the first (since the first column is OriginURL)
    let sampleRows = _.sampleSize(tableDataUpdated, Math.min(tableDataUpdated.length, numForTree));
    let promiseArray = getRDFType(sampleRows, -1, this.state.usecaseSelected);

    allPromiseReady(promiseArray).then((values) => {
    allPromiseReady(promiseArrayOne).then((valuesOne) => {
    allPromiseReady(promiseArrayTwo).then((valuesTwo) => {

      // We call updateNeighbourInfo here because we are changing the rows
      let updatedNeighbours = updateNeighbourInfo(valuesOne, valuesTwo);
      let keyColNeighbours = updatedNeighbours.keyColNeighbours;
      let firstDegNeighbours = updatedNeighbours.firstDegNeighbours;

      // In here we call another helper function to store the ontology rdf:type of the sampleRows
      // to support semantic tree
      let typeRecord = buildTypeRecord(sampleRows, -1, values, this.state.usecaseSelected);
      // console.log(typeRecord);

      // Support for undo: 
      let lastAction = "runJoin";
      let prevState = 
        {
          "curActionInfo":this.state.curActionInfo,
          "tableData":this.state.tableData,
          "tableHeader":this.state.tableHeader,
          "keyColNeighbours":this.state.keyColNeighbours,
          "firstDegNeighbours":this.state.firstDegNeighbours,
          "selectedClassAnnotation":this.state.selectedClassAnnotation,
          "previewColIndex": this.state.previewColIndex,
          "typeRecord": this.state.typeRecord,
        };

      this.setState({
        curActionInfo: {"task":"afterPopulateColumn"},
        tableData: tableDataUpdated,
        tableHeader: tableHeaderUpdated,
        keyColNeighbours: keyColNeighbours,
        firstDegNeighbours: firstDegNeighbours,
        selectedClassAnnotation: selectedClassAnnotationUpdated,
        showJoinModal: false,
        previewColIndex: -1,
        lastAction: lastAction,
        prevState: prevState,
        typeRecord: typeRecord,
      })
    })
    })
    })
    })
  }

  // This function handles the expansion/collapse of an attribute in cell preview and origin
  togglePreviewElement(e, i) {
    let previewInfoExpanded = this.state.previewInfoExpanded.slice();
    previewInfoExpanded[i] = !previewInfoExpanded[i];
    this.setState({
      previewInfoExpanded: previewInfoExpanded,
    })
  }

  // This function handles the URL paste for table union. It should very similar to handleURLPaste
  handleUnionPaste(e) {

    document.body.classList.add('waiting');

    // We first get the urlPasted
    e.preventDefault();
    let urlPasted = (e.clipboardData || window.clipboardData).getData("text");

    // We first check if user has pasted a valid wikipedia page.
    if (!urlPasted.includes("https://en.wikipedia.org/wiki/")) {
      document.body.classList.remove('waiting');
      alert("Please paste a valid Wikipedia link.");
    }

    // If yes, we need to fetch the tables from the pasted Wikipedia page
    else {
      let promiseArray = [];
      promiseArray.push(fetchText(urlPasted));
      allPromiseReady(promiseArray).then((values) => {
        // We first parse the pasted URL and store the list of tables from the pasted URL
        let htmlText = values[0];
        let doc = new DOMParser().parseFromString(htmlText, "text/html");
        let wikiTableArray = doc.getElementsByClassName("wikitable");
        let unionTableArray = [];
        for (let i = 0; i < wikiTableArray.length; ++i) {
          if (wikiTableArray[i].tagName === "TABLE" && wikiTableArray[i].rows !== undefined) {
            unionTableArray.push(wikiTableArray[i]);
          }
        }
        let unionOpenList = [];
        for (let i = 0; i < unionTableArray.length; ++i) {
          unionOpenList.push(false);
        }

        document.body.classList.remove('waiting');

        // Need to add support for undo later. Skip for now
        this.setState({
          unionURL: urlPasted,
          unionTableArray: unionTableArray,
          unionOpenList: unionOpenList,
        })
      })
    }
  }

  // This function handles the toggle on/off for tables in unionTableArray
  toggleUnionTable(e, index) {
    let unionOpenList = this.state.unionOpenList.slice();
    unionOpenList[index] = !unionOpenList[index];
    // When we toggle on one table (to union), we want to close all other tables
    for (let i = 0; i < unionOpenList.length; ++i) {
      if (i !== index) {
        unionOpenList[i] = false;
      }
    }
    this.setState({
      unionOpenList: unionOpenList,
    })
  }

  // The function handles user clicking the "union" button for a table from unionTableArray
  // For now, it simply sets showUnionModal to true.
  showUnionAlign(e, index) {
    this.setState({
      showUnionModal: true,
    })
  }

  // The function handles cancel of union operation. For now, it just sets showUnionModal to false.
  cancelUnionAlign() {
    this.setState({
      showUnionModal: false,
    })
  } 

  // The following function is completely hardcoded: it performs the table union
  hardcodeUnion(e) {
    document.body.classList.add('waiting');

    let dataToUnion = setTableFromHTML(this.state.unionTableArray[0],"");
    // console.log(dataToUnion);

    // Now we should have a for loop to loop over dataToUnion.length
    // We also need to run a loop to queries to specifically fetch the dbo:starring attribute

    // Let's first take a look of all the movies (all entries from col index 2). 
    // Then we will ask the queries. Then, when we get our results back (the starring), 
    // we construct the new table data row by row. One cell at a time.
    // and concat the new table data with the existing table data.

    let promiseArray = [];

    for (let i = 0; i < dataToUnion.length; ++i) {
      let cellValue = dataToUnion[i][2].data === "N/A" ? "NONEXISTINGSTRING" : regexReplace(dataToUnion[i][2].data);
      let prefixURL = 
        "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
      let suffixURL = 
        "format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query+";
      let queryBody =
        "select+%3Fo%0D%0Awhere+%7B%0D%0Adbr%3A" + cellValue + "+dbo%3Astarring+%3Fo.%0D%0A%7D&";
      let queryURL = prefixURL + queryBody + suffixURL;
      let curPromise = fetchJSON(queryURL);
      promiseArray.push(curPromise);
    }

    allPromiseReady(promiseArray).then((values) => {

      // for (let i = 0; i < values.length; ++i) {
      //   console.log(values[i].results.bindings);
      // }

      // We have gotten all the data we need. Let's now put them together

      let otherTableData = [];

      for (let i = 0; i < dataToUnion.length; ++i) {
        let tempRow = [];
        // We push on the movies, directors, notes (which will be blank), starring (using the query results), and country in order
        // First movies
        tempRow.push(dataToUnion[i][2]);
        // Then directors
        tempRow.push(dataToUnion[i][4]);
        // Then notes. It will have blank data and origin
        tempRow.push({
          "data": "",
          "origin": "",
        })
        // Then starring. We need to use query results.
        if (values[i].results.bindings.length === 0) {
          tempRow.push({
            "data": "N/A",
          })
        }
        else {
          let tempData = "";
          for (let j = 0; j < values[i].results.bindings.length; ++j) {
            if (j > 0) {
              tempData+=";";
            }
            tempData+=removePrefix(values[i].results.bindings[j].o.value);
          }
          tempRow.push({
            "data": tempData,
            "origin":"",
          })
        }
        // Lastly, country.
        tempRow.push(dataToUnion[i][5]);

        // After the row has been set, we push the row onto otherTableData
        otherTableData.push(tempRow);
      }
      // console.log(otherTableData);

      let tableData = _.cloneDeep(this.state.tableData);
      tableData = tableData.concat(otherTableData);

      document.body.classList.remove('waiting');

      this.setState({
        showUnionModal: false,
        tableData: tableData,
      })
    })
  }

  // The following function handles users uploading a json table downloaded from website
  handleFileChange(e) {
    console.log("File just uploaded");
    let uploadedFile = e.target.files[0];
    let reader = new FileReader();
    reader.readAsText(uploadedFile);
    console.log("Reading file is done");
    reader.onload = async(e) => {
      let result = e.target.result;
      let content = await JSON.parse(result);
      // In here we have parsed the file read in
      console.log(content);

      // Note that originTableArray cannot be copied into the JSON file, we need to fetch it again here
      let promiseArray = [];
      promiseArray.push(fetchText(content.urlPasted));
      allPromiseReady(promiseArray).then((values) => {
      // We first parse the pasted URL and store the list of tables from the pasted URL
      let htmlText = values[0];
      let doc = new DOMParser().parseFromString(htmlText, "text/html");
      let wikiTableArray = doc.getElementsByClassName("wikitable");
      let originTableArray = [];
      for (let i = 0; i < wikiTableArray.length; ++i) {
        // console.log(wikiTableArray[i].rows);
        if (wikiTableArray[i].tagName === "TABLE" && wikiTableArray[i].rows !== undefined) {
          originTableArray.push(wikiTableArray[i]);
        }
      }
      originTableArray = content.usecaseSelected === "startTable" ? originTableArray : content.originTableArray;

      // Let's set state based on content
      this.setState({
        urlPasted: content.urlPasted,
        tablePasted: content.tablePasted,
        usecaseSelected: content.usecaseSelected,
        pageHidden: content.pageHidden,
        iframeURL: content.iframeURL,
        curActionInfo: content.curActionInfo,
        lastAction: content.lastAction,
        prevState: content.prevState,
        showSetting: false,
        showTableSelection: content.showTableSelection,
        tabIndex: content.tabIndex,
        showUnionTables: content.showUnionTables,
        showJoinTables: content.showJoinTables,

        keyColIndex: content.keyColIndex,
        tableHeader: content.tableHeader,
        tableData: content.tableData,
        optionsMap: content.optionsMap,
        keyColNeighbours: content.keyColNeighbours,
        firstDegNeighbours: content.firstDegNeighbours,
        firstColSelection: content.firstColSelection,
        firstColChecked: content.firstColChecked,
        firstColFilled: content.firstColFilled,
        firstColText: content.firstColIndex,
        keyCheckedIndex: content.keyCheckedIndex,
        firstColHeaderInfo: content.firstColHeaderInfo,
        otherColSelection: content.otherColSelection,
        otherColChecked: content.otherColChecked,
        otherCheckedIndex: content.otherCheckedIndex,
        otherColText: content.otherColText,

        originTableArray: originTableArray,
        tableOpenList: content.tableOpenList,
        selectedTableIndex: content.selectedTableIndex,
        selectedClassAnnotation: content.selectedClassAnnotation,
        tableDataExplore: content.tableDataExplore,
        propertyNeighbours: content.propertyNeighbours,
        semanticEnabled: content.semanticEnabled,
        unionCutOff: content.unionCutOff,

        showFilter: false,
        checkAll: true,
        curFilterIndex: -1,
        dataAndChecked: [],
        filterMin: null,
        filterMax: null,

        showJoinModal: false,
        joinTableIndex: -1,
        joinTableData: [],
        originColOptions: [],
        joinColOptions: [],
        originJoinIndex: -1,
        joinJoinIndex: -1,
        joinPairRecord: [],

        previewColIndex: content.previewColIndex,

        selectedCell: content.selectedCell,
        previewInfoArray: content.previewInfoArray,
        previewInfoExpanded: content.previewInfoExpanded,

        unionURL: content.unionURL,
        unionTableArray: content.unionTableArray,
        unionOpenList: content.unionOpenList,
        showUnionModal: false,

        semanticTree: content.semanticTree,
        typeRecord: content.typeRecord,
      })
    })
    }
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
          handleFileChange={this.handleFileChange}
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
              fullState = {this.state}
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
                    onCellChange={this.cellChange}
                    selectColHeader={this.selectColHeader}
                    getKeyOptions={this.getKeyOptions}
                    optionsMap={this.state.optionsMap}
                    contextAddColumn={this.contextAddColumn}
                    contextDeleteColumn={this.contextDeleteColumn}
                    contextSetColumn={this.contextSetColumn}
                    originPreviewPage={this.originPreviewPage}
                    showFilterMethods={this.showFilterMethods}
                    // Following states control the render of first column header
                    firstColFilled={this.state.firstColFilled}
                    handlePlusClick={this.handlePlusClick}
                    firstColHeaderInfo={this.state.firstColHeaderInfo}
                    // Following states control the render of other column header
                    getOtherOptions={this.getOtherOptions}
                    // Following states control the render of column preview
                    previewColIndex={this.state.previewColIndex}
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
                    sameNeighbourDiffRow={this.sameNeighbourDiffRow}
                    sameNeighbourOneRow={this.sameNeighbourOneRow}
                    populateRecommendation={this.populateRecommendation}
                    populateStartRecommend={this.populateStartRecommend}
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
                    firstColText={this.state.firstColText}
                    firstColFilled={this.state.firstColFilled}
                    keyColIndex={this.state.keyColIndex}
                    toggleFirstNeighbour={this.toggleFirstNeighbour}
                    firstColTextChange={this.firstColTextChange}
                    tableHeader={this.state.tableHeader}
                    keyCheckedIndex={this.state.keyCheckedIndex}
                    addToFirstCol={this.addToFirstCol}
                    confirmAddFirstCol={this.confirmAddFirstCol}
                    // Following states are for other column's header selection
                    otherColSelection={this.state.otherColSelection}
                    otherColChecked={this.state.otherColChecked}
                    otherColText={this.state.otherColText}
                    otherCheckedIndex={this.state.otherCheckedIndex}
                    toggleOtherNeighbour={this.toggleOtherNeighbour}
                    otherColTextChange={this.otherColTextChange}
                    // Following states are for column's processing methods
                    contextSortColumn={this.contextSortColumn}
                    contextDedupColumn={this.contextDedupColumn}
                    openFilter={this.openFilter}
                    // Following states are for displaying cell's preview and origin
                    previewInfoArray={this.state.previewInfoArray}
                    previewInfoExpanded={this.state.previewInfoExpanded}
                    selectedCell={this.state.selectedCell}
                    togglePreviewElement={this.togglePreviewElement}
                    // Following states are for showStartRecommend
                    keyColNeighbours={this.state.keyColNeighbours}
                    // Following states are for customized table union
                    unionURL={this.state.unionURL}
                    handleUnionPaste={this.handleUnionPaste}
                    unionTableArray={this.state.unionTableArray}
                    unionOpenList={this.state.unionOpenList}
                    toggleUnionTable={this.toggleUnionTable}
                    showUnionAlign={this.showUnionAlign}
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
                  checkAll={this.state.checkAll}
                  applyFilter={this.applyFilter}
                  cancelFilter={this.cancelFilter}
                  toggleChecked={this.toggleChecked}
                  toggleAll={this.toggleAll}
                  // Support for range filter
                  tableData={this.state.tableData}
                  curFilterIndex={this.state.curFilterIndex}
                  filterMin={this.state.filterMin}
                  filterMax={this.state.filterMax}
                  handleRangeFilter={this.handleRangeFilter}
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
                  // support for suggested join
                  joinPairRecord={this.state.joinPairRecord}
                />
              </div>
              <div>
                <UnionModal
                  showUnionModal={this.state.showUnionModal}
                  cancelUnionAlign={this.cancelUnionAlign}
                  hardcodeUnion={this.hardcodeUnion}
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
  return fetch(urlCORS)
        .then(function (response) {
          if (!response.ok) {
            throw Error(1);
          }
          return response;
        })
        .then(function (response) {
          return response.json();
        })
        .catch(function (error) {
          document.body.classList.remove('waiting');
          // alert("Some error occured when accessing SPARQL public endpoint. If semantic mapping is enabled, disable it and try again.");
          return 1;
        })
}

// This function takes in a queryURL and returns its Text format
function fetchText(url) {
  let urlCORS = "https://mysterious-ridge-15861.herokuapp.com/"+url;
  return fetch(urlCORS)
         .then((response) => response.text())
         .catch(function (error) {
           document.body.classList.remove("waiting");
           return 1;
         });
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
    .replace(/</g, "%5Cu003C")
    .replace(/=/g, "%5Cu003D")
    .replace(/>/g, "%5Cu003E")
    .replace(/\?/g, "%5Cu003F")
    .replace(/\./g, "%5Cu002E")
    .replace(/\//g, "%5Cu002F")
    .replace(/,/g, "%5Cu002C")
    .replace(/\s/g, "_")
    .replace(/@/g, "%5Cu0040")
    .replace(/\^/g, "%5Cu005E")
    .replace(/~/g, "%5Cu007E")
    .replace(/`/g, "%5Cu0060")
    .replace(/\|/g, "%5Cu007C")
    .replace(/\[/g, "%5Cu005B")
    .replace(/\\/g, "%5Cu005C")
    .replace(/\]/g, "%5Cu005D")
    .replace(/\{/g, "%5Cu007B")
    .replace(/\}/g, "%5Cu007D");
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
    .replace(/</g, "%5Cu003C")
    .replace(/=/g, "%5Cu003D")
    .replace(/>/g, "%5Cu003E")
    .replace(/\?/g, "%5Cu003F")
    .replace(/\./g, "%5Cu002E")
    .replace(/\//g, "%5Cu002F")
    .replace(/,/g, "%5Cu002C")
    .replace(/\s/g, "_")
    .replace(/@/g, "%5Cu0040")
    .replace(/\^/g, "%5Cu005E")
    .replace(/~/g, "%5Cu007E")
    .replace(/`/g, "%5Cu0060")
    .replace(/\|/g, "%5Cu007C")
    .replace(/\[/g, "%5Cu005B")
    .replace(/\\/g, "%5Cu005C")
    .replace(/\]/g, "%5Cu005D")
    .replace(/\{/g, "%5Cu007B")
    .replace(/\}/g, "%5Cu007D");
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

// This function updates the key column's neighbours for ONE entry from the search column.

// It taks three parameters:
//  1) array "keyColNeighbour" storing list of neighbours for the key column
//  2) array "resultsBinding", storing the returned result of queryURL from Virtuoso
//  3) string "type", either "subject" or "object"

// It returns the updated keyColNeighbours
function updateKeyColNeighbours(keyColNeighbours, resultsBinding, type) {

  // console.log(resultsBinding);

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
         || a.p.value === "http://dbpedia.org/property/logo"
         || a.p.value === "http://dbpedia.org/property/shorts"
         || a.p.value === "http://dbpedia.org/property/patternS"
         || a.p.value === "http://dbpedia.org/property/patternB"
         || a.p.value === "http://dbpedia.org/property/body"
         || a.p.value === "http://dbpedia.org/property/hShorts"
         || a.p.value === "http://dbpedia.org/property/hPatternS"
         || a.p.value === "http://dbpedia.org/property/hPatternB"
         || a.p.value === "http://dbpedia.org/property/hBody"
         || a.p.value === "http://dbpedia.org/property/aShorts"
         || a.p.value === "http://dbpedia.org/property/aPatternS"
         || a.p.value === "http://dbpedia.org/property/aPatternB"
         || a.p.value === "http://dbpedia.org/property/aBody"
         || a.p.value === "http://dbpedia.org/property/3Shorts"
         || a.p.value === "http://dbpedia.org/property/3PatternS"
         || a.p.value === "http://dbpedia.org/property/3PatternB"
         || a.p.value === "http://dbpedia.org/property/3Body"
         || a.p.value === "http://dbpedia.org/property/nba"
         || a.p.value === "http://dbpedia.org/ontology/termPeriod"
         )
  );

  // We remove predicate in dbp that appear in both dbo and dbp: 
  // ex: dbo:spouse and dbp:spouse
  processedBinding = processedBinding.sort(function (a, b) {
    if (a.p.value.slice(28) > b.p.value.slice(28)) {
      return 1;
    }
    else if (a.p.value.slice(28) < b.p.value.slice(28)) {
      return -1;
    }
    else {
      if (a.p.value.includes("ontology") && b.p.value.includes("property")) {
        return -1;
      }
      return 1;
    }
  })
  
  for (let i = 1; i < processedBinding.length; ++i) {
    if (processedBinding[i].p.value.includes("property") && processedBinding[i-1].p.value.includes("ontology") &&
        processedBinding[i].p.value.slice(28) === processedBinding[i-1].p.value.slice(28)) {
      processedBinding.splice(i,1);
      --i;
    }
  }

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
      // If the current neighbour is equal to neighbourToAdd, we increment the count, and push onto valuesToAdd
      if (curNeighbour === neighbourToAdd) {
        ++neighbourCount;
        valuesToAdd.push(type === "subject" ? removePrefix(processedBinding[i].o.value) : removePrefix(processedBinding[i].s.value))
      }
      // else, we push neighbourToAdd to keyColNeighbours. 
      else {
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
        // set data. Let's do some processing here: we want to ensure that valuesToAdd has a max length of maxNeighbourCount
        let objData = valuesToAdd.length <= maxNeighbourCount ? valuesToAdd : valuesToAdd.slice(0, maxNeighbourCount);
        // set range
        let objRange = neighbourRange;
        // set subPropertyOf
        let objSubPropertyOf = neighbourSubPropertyOf;
        // set dataset


        // Set object from all its attributes
        let tempObj = {
          "value":objValue, 
          "label":objLabel, 
          "type":objType, 
          // "dataset":""
          "count":objCount, 
          "filledCount":1, 
          "data":objData,
          "range":objRange,
          "subPropertyOf":objSubPropertyOf
        };
        // We push this tempObj onto keyColNeighbours
        keyColNeighbours.push(tempObj)

        // We now need to reset neighbourCount, neighbourToAdd, neighbourRange, neighbourSubPropertyOf, and valuesToAdd
        neighbourCount = 1;
        neighbourToAdd = curNeighbour;
        valuesToAdd = [type === "subject" ? removePrefix(processedBinding[i].o.value) : removePrefix(processedBinding[i].s.value)];
        neighbourRange = processedBinding[i].range !== undefined ? processedBinding[i].range.value : "";
        neighbourSubPropertyOf = processedBinding[i].subPropertyOf !== undefined ? processedBinding[i].subPropertyOf.value : "";
      }
    }
    // Now, after the loop is done, we need to do one more iteration to determine how we want to add the last neighbour.
    
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
    // set data. Let's do some processing here: we want to ensure that valuesToAdd has a max length of maxNeighbourCount
    let objData = valuesToAdd.length <= maxNeighbourCount ? valuesToAdd : valuesToAdd.slice(0, maxNeighbourCount);
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
         || a.p.value === "http://dbpedia.org/property/logo"
         || a.p.value === "http://dbpedia.org/property/shorts"
         || a.p.value === "http://dbpedia.org/property/patternS"
         || a.p.value === "http://dbpedia.org/property/patternB"
         || a.p.value === "http://dbpedia.org/property/body"
         || a.p.value === "http://dbpedia.org/property/hShorts"
         || a.p.value === "http://dbpedia.org/property/hPatternS"
         || a.p.value === "http://dbpedia.org/property/hPatternB"
         || a.p.value === "http://dbpedia.org/property/hBody"
         || a.p.value === "http://dbpedia.org/property/aShorts"
         || a.p.value === "http://dbpedia.org/property/aPatternS"
         || a.p.value === "http://dbpedia.org/property/aPatternB"
         || a.p.value === "http://dbpedia.org/property/aBody"
         || a.p.value === "http://dbpedia.org/property/3Shorts"
         || a.p.value === "http://dbpedia.org/property/3PatternS"
         || a.p.value === "http://dbpedia.org/property/3PatternB"
         || a.p.value === "http://dbpedia.org/property/3Body"
         || a.p.value === "http://dbpedia.org/property/nba"
         || a.p.value === "http://dbpedia.org/ontology/termPeriod"
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
        "value": [removePrefix(processedBinding[0].o.value)],
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
        if (previewInfoArray[curIndex].value.length < maxNeighbourCount) {
          previewInfoArray[curIndex].value.push(removePrefix(processedBinding[i].o.value));
        }
      }
      // Else, we push a fresh element onto previewInforArray, and update curIndex
      else {
        previewInfoArray.push(
          {
            "key": type === "subject" ? processedBinding[i].p.value.slice(28) : "is "+processedBinding[i].p.value.slice(28)+" of",
            "value":[removePrefix(processedBinding[i].o.value)],
          }
        )
        ++curIndex;
      }
    }
  }

  // At the current stage, previewInfoArray contains all the dbo and dbp neighbours. 
  // Let's also add support for the DB categories, so that those can be displayed in cell preview as well.
  let categoryPreviewInfoArray = [];
  if (type === "subject") {
    let categoryBinding = resultsBinding.filter(
      a => a.p.value.includes("dc/terms/subject")
    ) 
    // console.log(categoryBinding);
    if (categoryBinding.length > 0) {
      categoryPreviewInfoArray.push(
        {
          "key": "Category",
          "value": [categoryBinding[0].o.value.slice(37)]
        }
      );
      for (let i = 1; i < categoryBinding.length; ++i) {
        categoryPreviewInfoArray[0].value.push(categoryBinding[i].o.value.slice(37));
      }
    }
  }
  // We concat categoryPreviewInfoArray with previewInfoArray.
  previewInfoArray = categoryPreviewInfoArray.concat(previewInfoArray);
  // console.log(previewInfoArray);

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
         || a.p.value === "http://dbpedia.org/property/logo"
         || a.p.value === "http://dbpedia.org/property/shorts"
         || a.p.value === "http://dbpedia.org/property/patternS"
         || a.p.value === "http://dbpedia.org/property/patternB"
         || a.p.value === "http://dbpedia.org/property/body"
         || a.p.value === "http://dbpedia.org/property/hShorts"
         || a.p.value === "http://dbpedia.org/property/hPatternS"
         || a.p.value === "http://dbpedia.org/property/hPatternB"
         || a.p.value === "http://dbpedia.org/property/hBody"
         || a.p.value === "http://dbpedia.org/property/aShorts"
         || a.p.value === "http://dbpedia.org/property/aPatternS"
         || a.p.value === "http://dbpedia.org/property/aPatternB"
         || a.p.value === "http://dbpedia.org/property/aBody"
         || a.p.value === "http://dbpedia.org/property/3Shorts"
         || a.p.value === "http://dbpedia.org/property/3PatternS"
         || a.p.value === "http://dbpedia.org/property/3PatternB"
         || a.p.value === "http://dbpedia.org/property/3Body"
         || a.p.value === "http://dbpedia.org/property/nba"
         || a.p.value === "http://dbpedia.org/ontology/termPeriod"
         )
  );

  // We remove predicate in dbp that appear in both dbo and dbp: 
  // ex: dbo:spouse and dbp:spouse
  processedBinding = processedBinding.sort(function (a, b) {
    if (a.p.value.slice(28) > b.p.value.slice(28)) {
      return 1;
    }
    else if (a.p.value.slice(28) < b.p.value.slice(28)) {
      return -1;
    }
    else {
      if (a.p.value.includes("ontology") && b.p.value.includes("property")) {
        return -1;
      }
      return 1;
    }
  })
  
  for (let i = 1; i < processedBinding.length; ++i) {
    if (processedBinding[i].p.value.includes("property") && processedBinding[i-1].p.value.includes("ontology") &&
        processedBinding[i].p.value.slice(28) === processedBinding[i-1].p.value.slice(28)) {
      processedBinding.splice(i,1);
      --i;
    }
  }
  
  // We then sort the processedBinding by some criterias.

  // First Criteria: dct:subjects should show up at the top of the list, sorted by o.value.slice(37).

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

  // We first sort the dctArray by o.value.slice(37).

  dctArray.sort((a, b) => (a.o.value.slice(37) < b.o.value.slice(37) ? -1 : 1));

  // We then sort dbop array by the following rules:
  // Those that are dbr (so without a datatype) shows up higher
  // Then those with a smaller count shows up higher
  // Then alphabetical order.

  // The following code gets the count for each property(or neighbour)
  dbopArray.sort((a, b) => (a.p.value.slice(28) < b.p.value.slice(28) ? -1 : 1));
  if (dbopArray.length > 0) {
    dbopArray[0].p.count = getPCount(dbopArray[0].p.value, dbopArray);
  }
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

  // At this stage, we have finished sorting both dctArray and dbopArray. Let's put them back together.
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
          "label":processedBinding[i].o.value.slice(37),
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
  // console.log(firstColSelection);
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
    // console.log(wikiTablesFound[i].tagName);
    if (wikiTablesFound[i].tagName === "TABLE" && wikiTablesFound[i].rows !== undefined) {
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
  // console.log(pageName);
  // console.log(tableHTML);
  // console.log(tableHTML.rows);
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
    // In here we do a bit of string matching
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
    // console.log(selectedTable.rows[i]);
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

  // console.log(tempTable);
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
    let minLength = Math.min(tableDataExplore[i].length, tableHeader.length);
    for (let j=0;j<minLength;++j) {
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
    // For the first column, let's just use its data as the origin
    let tempOrigin = tableData[i][colIndex].data;
    tableData[i][colIndex].origin.push(tempOrigin);
  }

  // Now we dedup by tableData by tableData[i][0].data
  tableData = _.uniqBy(tableData, function(x) {return x[0].data;});

  // console.log(tableData);
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
    keyColNeighbours[i].filledPercent = filledPercent;
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
    let curNeighbourText = neighbourArray[i].type === "object" ? "is " + neighbourArray[i].value + " of" : neighbourArray[i].value ;
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
  // console.log(processedNeighboursCopy);
  let processedNeighbours = _.cloneDeep(processedNeighboursCopy);


  // To do this, we need to a double loop over the processedNeighbours
  for (let i = 0; i < processedNeighbours.length; ++i) {

    // Initialize the recommendNeighbours array
    let recommendNeighbours = [];
    
    for (let j = 0; j < processedNeighbours.length; ++j) {
      // We only look at cases where i !== j
      if (i !== j) {
        // We consider two types of matching

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

        // updated on 9/13: hardcode "starring" to be in "director"'s attribute recommendations
        if ((processedNeighbours[i].value === "director" && processedNeighbours[i].type === "subject") &&
            (processedNeighbours[j].value === "starring" && processedNeighbours[j].type === "subject")) {
          // console.log(processedNeighbours[i]);
          // console.log(processedNeighbours[j]);
          recommendNeighbours.push(
            {
              "value": processedNeighbours[j].value,
              "type": processedNeighbours[j].type,
              "relation": "magic!",
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

function createRecommendArray(neighbourArray, keyColNeighbours) {
  // We create the recommendArray variable using a simple rule:
  // It should be union of recommendNeighbours of all neighbours from neighbourArray, minus the neighbours from neighbourArray
  let recommendArray = [];

  // First we run a loop to take the union of recommendNeighbours
  for (let i = 0; i < neighbourArray.length; ++i) {
    recommendArray = recommendArray.concat(neighbourArray[i].recommendNeighbours);
  }

  // console.log(neighbourArray);
  // console.log(recommendArray);

  // We then remove recommendations that are completely duplicated
  recommendArray = _.uniqBy(recommendArray, function(x) {
    return x.value || x.type || x.relation;
  });
  // We then remove recommendations that are already in neighbourArray
  recommendArray = _.differenceBy(recommendArray, neighbourArray, function(x) {
    return x.value || x.type;
  });

  // We want to do one more thing here: get the filledPercentage for the recommendation attributes

  // console.log(recommendArray);
  // console.log(keyColNeighbours);

  for (let i = 0; i < recommendArray.length; ++i) {
    for (let j = 0; j < keyColNeighbours.length; ++j) {
      if (recommendArray[i].value === keyColNeighbours[j].value && recommendArray[i].type === keyColNeighbours[j].type) {
        recommendArray[i]["label"] = keyColNeighbours[j].label;
        recommendArray[i]["filledPercent"] = keyColNeighbours[j].filledPercent;
        break;
      }
    }
  }
  // We now sort the recommendArray by filledPercent attribute
  recommendArray.sort((a, b) =>
    a.filledPercent < b.filledPercent ? 1 : -1
  );
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

  // console.log(neighbourArray);

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

// The following is a helper function used to update firstDegNeighbours and keyColNeighbours.
// It makes use of two query result arrays.

// It return an object with two attributes: firstDegNeighbours and keyColNeighbours

// This function should be called whenever number of rows are changed.

function updateNeighbourInfo(valuesOne, valuesTwo) {
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
  // console.log(subjectNeighbourArray);
  firstDegNeighbours["subject"] = storeFirstDeg(subjectNeighbourArray);
  let processedSubjectNeighbours = processAllNeighbours(subjectNeighbourArray);
  processedSubjectNeighbours = addRecommendNeighbours(processedSubjectNeighbours);

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

  // we now concat subjectNeighbours and objectNeighbours together
  let keyColNeighbours = processedSubjectNeighbours.concat(processedObjectNeighbours);

  // console.log(keyColNeighbours);
  // console.log(firstDegNeighbours);
  return {
    "firstDegNeighbours":firstDegNeighbours,
    "keyColNeighbours":keyColNeighbours,
  }
}

// Added on Sept 13: 
// The following is helper function to update the firstColSelection options to include all entities from first column
// This function should just use something very similar to updateFirstColSelection in a loop. Then do some processing in the end.

function updateUnionSelection(valuesOne) {

  // initialize array to store the union of all firstColSelection
  let unionSelection = [];

  // the two following arrays store the dct neighbours and dbo/p neighbours respectively
  let dctArray = [];
  let dbopArray = [];

  // We loop over the first degree neighbours for every entry in the first column
  for (let i = 0; i < valuesOne.length; ++i) {

    // We first filter out those in resultsBinding according to three criterias
    // Note: the second criteria is a bit different from updateKeyColNeighbours and updatePreviewInfo

    // 1) p.value.slice(28).length must > 1
    // 2) p.value must include "ontology", "property", or "dc/terms/subject" (so it is one of dbo:XXXX, dbp:XXXX, or dct:subject)
    // 3) p.value must not include certain strings (which likely correspond to meaningless attributes)

    let resultsBinding = valuesOne[i].results.bindings;

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
          || a.p.value === "http://dbpedia.org/property/logo"
          || a.p.value === "http://dbpedia.org/property/shorts"
          || a.p.value === "http://dbpedia.org/property/patternS"
          || a.p.value === "http://dbpedia.org/property/patternB"
          || a.p.value === "http://dbpedia.org/property/body"
          || a.p.value === "http://dbpedia.org/property/hShorts"
          || a.p.value === "http://dbpedia.org/property/hPatternS"
          || a.p.value === "http://dbpedia.org/property/hPatternB"
          || a.p.value === "http://dbpedia.org/property/hBody"
          || a.p.value === "http://dbpedia.org/property/aShorts"
          || a.p.value === "http://dbpedia.org/property/aPatternS"
          || a.p.value === "http://dbpedia.org/property/aPatternB"
          || a.p.value === "http://dbpedia.org/property/aBody"
          || a.p.value === "http://dbpedia.org/property/3Shorts"
          || a.p.value === "http://dbpedia.org/property/3PatternS"
          || a.p.value === "http://dbpedia.org/property/3PatternB"
          || a.p.value === "http://dbpedia.org/property/3Body"
          || a.p.value === "http://dbpedia.org/property/nba"
          || a.p.value === "http://dbpedia.org/ontology/termPeriod"
          )
    );
    // Now we run an inner loop to loop over each processedBinding
    for (let j = 0; j < processedBinding.length; ++j) {
      if (processedBinding[j].p.value === "http://purl.org/dc/terms/subject") {
        dctArray.push(processedBinding[j]);
      }
      else {
        dbopArray.push(processedBinding[j]);
      }
    } 
  }

  // Now we deal with dctArray and dbopArray

  // First is dctArray. We first dedup it based on o.value. Then sort by o.value.slice(37)
  dctArray = _.uniqBy(dctArray, function(x) {return x.o.value});
  dctArray.sort((a, b) => (a.o.value.slice(37) < b.o.value.slice(37) ? -1 : 1));

  // Second is dbopArray. We first remove those entries with both p.value and o.value duplicated
  dbopArray = _.uniqBy(dbopArray, function(x) {return x.p.value && x.o.value});
  // Then we sort. Two sorting criterias: 
  // 1) Those that are dbr (so without a datatype) shows up higher.
  // 2) Then in alphabetical order
  dbopArray.sort(function (a, b) {
    if (a.o.datatype === undefined && b.o.datatype !== undefined) {
      return -1;
    }
    else if (b.o.datatype === undefined && a.o.datatype !== undefined) {
      return 1;
    }
    else {
      return a.p.value.slice(28) < b.p.value.slice(28) ? -1 : 1;
    }
  });

  // Now that both dctArray and dbopArray have the corret elements, we push them onto unionSelection array
  // console.log(dctArray);
  // console.log(dbopArray);
  for (let i = 0; i < dctArray.length; ++i) {
    unionSelection.push(
      {
        "pValue":"category",
        "pDataset":"dct",
        "oValue":dctArray[i].o.value.slice(37),
        "oType":"",
        "value":"category",
        "label":dctArray[i].o.value.slice(37),
      }
    )
  }
  for (let i = 0; i < dbopArray.length; ++i) {
    unionSelection.push(
      {
        "pValue":dbopArray[i].p.value.slice(28),
        "pDataset":dbopArray[i].p.value.includes("property") ? "dbp" : "dbo",
        "oValue":removePrefix(dbopArray[i].o.value),
        "oType":dbopArray[i].o.datatype === undefined ? "" : dbopArray[i].o.datatype,
        "value":dbopArray[i].p.value.slice(28),
        "label":dbopArray[i].p.value.slice(28)+":"+removePrefix(dbopArray[i].o.value),
      }
    )
  }
  // console.log(unionSelection);

  // Now we create unionChecked, which is an array of false, length === length of unionSelection
  let unionChecked = [];
  for (let i = 0; i < unionSelection.length; ++i) {
    unionChecked.push(false);
  }

  // Now we create the return value
  let selectionInfo = {
    "firstColSelection":unionSelection,
    "firstColChecked":unionChecked,
  };

  return selectionInfo;
}

// Helper function to computer the three most joinable columns 
// This function returns an array (max len 3) of objects with two attributes:
// 1) indices: which two columns are we joining on
// 2) joinScore: number storing the joinability score
function computeJoinableColumn(originTableData, joinTableData, originTableHeader, joinTableHeader) {
  // console.log(originTableData);
  // console.log(joinTableData);
  // console.log(originTableHeader);
  // console.log(joinTableHeader);

  // First thing to do is to get all the data in column format

  // First we process originTableData
  let originColumns = [];
  let firstColIndex = originTableHeader[0].value === "OriginURL" ? 1 : 0;
  for (let i = firstColIndex; i < originTableHeader.length; ++i) {
    let curColData = [];
    for (let j = 0; j < originTableData.length; ++j) {
      curColData.push(originTableData[j][i].data);
    }
    originColumns.push(curColData);
  }  
  // console.log(originColumns);

  // Then we process joinTableData. Note that the first column of joinTableData will be OriginURL for sure
  let joinColumns = [];
  for (let i = 1; i < joinTableHeader.length; ++i) {
    let curColData = [];
    // we start j index from 1 because joinTableData first row is the header
    for (let j = 1; j < joinTableData.length; ++j) {
      curColData.push(joinTableData[j][i].data);
    }
    joinColumns.push(curColData);
  }
  // console.log(joinColumns);

  // Now we loop n^2 times, for each c_i in originColumns and c_j in joinColumns.
  // for each pair, we will record its joinability score and the pair of indices
  let allPairsRecord = [];
  for (let i = 0; i < originColumns.length; ++i) {
    for (let j = 0; j < joinColumns.length; ++j) {
      let numFound = 0;
      for (let k = 0; k < originColumns[i].length; ++k) {
        let curVal = originColumns[i][k];
        if (joinColumns[j].includes(curVal)) {
          numFound++;
        }
      }
      let indexAddOne = originTableHeader[0].value === "OriginURL" ? 1 : 0;
      let joinScore = numFound/originColumns[i].length;
      allPairsRecord.push(
        {
          "indices":[i+indexAddOne, j+1],
          "joinScore":joinScore,
        }
      )
    }
  }

  // We sort the allPairsRecord by joinScore, then take the top min(allPairsRecord.length, 3)
  allPairsRecord.sort((a, b) =>
    a.joinScore < b.joinScore ? 1 : -1
  );

  allPairsRecord = allPairsRecord.slice(0, Math.min(allPairsRecord.length, 3))

  // We do an extra filtering step here to remove entries with joinScore of 0
  allPairsRecord = allPairsRecord.filter(a => a.joinScore > 0);

  // Take a look to see if allPairsRecord looks correct
  // console.log(allPairsRecord);

  return allPairsRecord;
}

// Helper function that takes input: this.state.tableData and this.state.tableHeader
// and outputs which second and third deg neighbours we need to fetch (the exact ones)
function getAutofillInfo(tableData) {
  // First take a look at the data passed in
  // console.log(tableData);

  // Since we have modified how origin is stored (now even N/A cells has origins)
  // We look at the first row (first record) to get all the columns information
  let firstRecord = tableData[0].slice();
  let oneDegInfo = [];
  let twoDegInfo = [];
  let threeDegInfo = [];
  let columnInfo = [];
  let longHopWarning = false;
  for (let i = 1; i < firstRecord.length; ++i) {
    let curOrigin = firstRecord[i].origin;
    // We only care about columns that are 1 to 3 hops away
    if (curOrigin.length >= 2 && curOrigin.length <= 4) {
      curOrigin = curOrigin.slice(1);
      let curInfo = [];
      for (let j = 0; j < curOrigin.length; ++j) {
        let curString = curOrigin[j].split(":")[0].split(" OR ")[0];
        let curType = curString.substring(0, 3) === "is " ? "object" : "subject";
        let curValue = curType === "object" ? curString.substring(3, curString.length - 3) : curString; 
        curInfo.push({
          "value": curValue,
          "type": curType,  
        });
      }
      if (curInfo.length === 1) {
        oneDegInfo.push(curInfo);
      }
      else if (curInfo.length === 2) {
        twoDegInfo.push(curInfo);
      }
      else if (curInfo.length === 3) {
        threeDegInfo.push(curInfo);
      }
      else {
        alert("Autofill information has caused an error!");
      }
      columnInfo.push(curInfo);
    }
    else {
      columnInfo.push([]);
    }
    if (curOrigin.length > 4) {
      longHopWarning = true;
    }
  }
  // we store all these information in a single object with four properties 
  
  // Note that when longHopWarning is true, that means not all columns will be auto-populated
  // in which case we should display a warning 
  let returnVal = {
    "longHopWarning": longHopWarning,
    "oneDegInfo": oneDegInfo,
    "twoDegInfo": twoDegInfo,
    "threeDegInfo": threeDegInfo,
    "columnInfo": columnInfo,
  }

  return returnVal;
}

// Helper function to automatically fill all the first degree neighbours
// This function currently ignores the OR case.
// It should look very similar to populateOtherColumn

function autofillFirstDeg(tableDataPassed, columnInfo, colIndex, fillStartIndex, firstDegNeighboursPassed, keyColIndex) {
  // console.log(tableData);
  // console.log(columnInfo);
  // console.log(colIndex);
  // console.log(fillStartIndex);
  // console.log(firstDegNeighbours);

  let tableData = _.cloneDeep(tableDataPassed);
  let firstDegNeighboursPassedCopy = _.cloneDeep(firstDegNeighboursPassed);

  for (let i = fillStartIndex; i < tableData.length; ++i) {
    // console.log(tableData[i]);
    // curColumnArray is the dataArray for each entry (row) in search column
    let curColumnArray = [];
    // Since we are not worrying about OR case here. We only have one neighbour, which has a value and a type (subject or object)
    let curNeighbour = columnInfo[0];
    let firstDegNeighbours =
      curNeighbour.type === "subject" ? firstDegNeighboursPassedCopy.subject : firstDegNeighboursPassedCopy.object;
    // console.log(firstDegNeighbours);
    let curNeighbourData = firstDegNeighbours[i][curNeighbour.value];
    // console.log("Current neighbour data is "+curNeighbourData);
    // If yes, we want to concat those values with curColumnArray
    if (curNeighbourData !== undefined) {
      curColumnArray = curColumnArray.concat(curNeighbourData);
    }
    // Take a look at curColumnArray
    // console.log(curColumnArray);

    // If curColumnArray is empty, that means this entry in searchColumn do not the attribute we are looking for
    if (curColumnArray.length === 0) {
      // we set the data to N/A
      let curData = "N/A";
      tableData[i][colIndex].data = curData;
      // Note that we still want to set origin to support autofill
      let curNeighbourText = curNeighbour.type === "object" ? "is " + curNeighbour.value + " of" : curNeighbour.value;
      let originToAdd = curNeighbourText + ":" + curData;
      let keyOrigin = tableData[i][keyColIndex].origin.slice();
      keyOrigin.push(originToAdd);
      tableData[i][colIndex].origin = keyOrigin;
    }
    // Otherwise, we have found at least one value.
    else {
      // we first set the data for the cell using curColumnArray[0]
      let curData = curColumnArray[0]
      tableData[i][colIndex].data = curData;
      // we then set origin for the cell. Need to use neighbourArray to get the correct text for the origin
      let curNeighbourText = curNeighbour.type === "object" ? "is " + curNeighbour.value + " of" : curNeighbour.value;
      let originToAdd = curNeighbourText + ":" + curData;
      let keyOrigin = tableData[i][keyColIndex].origin.slice();
      keyOrigin.push(originToAdd);
      tableData[i][colIndex].origin = keyOrigin;
      // console.log(keyOrigin)
    }
  }
  // Now, we are done with updating tableData. Take a look.
  // console.log(tableData);
  return tableData;
}

// This is a helper function to generate the query we needed to fetch the 2nd and 3rd deg neighbours
function autofillFarPromise(tableData, columnInfo, fillStartIndex) {
  // console.log(tableData);
  // console.log(columnInfo);
  // console.log(fillStartIndex);

  // Our task is to generate an array of queries that looks like below
  // based on all the inputs

  // First of all, we construct the promiseArray
  let promiseArray = [];

  // select ?o1 ?o2
  // where {
  // OPTIONAL {dbr:Devullu dbo:director/dbo:birthPlace ?o1}.
  // OPTIONAL {dbr:Devullu dbo:director/dbo:birthPlace/^dbo:restingPlace ?o2}.
  // }
  // limit 1

  // Let's generate our query clause by clause

  // We loop over tableData because we need to generate multiple queries (30 or 45)

  for (let j = fillStartIndex; j < tableData.length; ++j) {
    // First is the prefix clause, this remains the same
    let prefixClause = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";

    // Next is the select clause
    // we need to determine how many objects (variables, or columns) we are fetching

    // Ex: "select+%3Fo1+%3Fo2%0D%0A"
    let numVar = 0;
    for (let i = 0; i < columnInfo.length; ++i) {
      if (columnInfo[i].length > 1) {
        numVar++;
      }
    }
    let selectClause = "select";
    for (let i = 1; i <= numVar; ++i) {
      selectClause = selectClause + "+%3Fo" + i;
    }
    selectClause+="%0D%0A";

    // Next is the beginning of the where clause
    let whereClause = "where+%7B%0D%0A";

    // Next is an array of optional clauses.
    // First we still need to set the o_i index, starting from 1.
    // Ex: "OPTIONAL+%7Bdbr%3ADevullu+dbo%3Adirector%2Fdbo%3AbirthPlace%2F%5Edbo%3ArestingPlace+%3Fo2%7D.%0D%0A"
    let optionClause = "";

    let optionIndex = 1;
    // We loop through all the columns (paths)
    for (let i = 0; i < columnInfo.length; ++i) {
      if (columnInfo[i].length > 1) {
        let curClause = "OPTIONAL+%7Bdbr%3A";
        // we can use 0 for the second index because the first column has to be the search column right now
        let cellValue = regexReplace(tableData[j][0].data);
        curClause = curClause + cellValue + "+";
        // we now loop over all the predicates that form this query path 
        for (let k = 0; k < columnInfo[i].length; ++k) {
          // if this is not the start of the path, we need to append the symbol "/"
          if (k > 0) {
            curClause += "%2F";
          }
          // if this current predict has type "object", we need to append the symbol "^" to indicate inverse path
          if (columnInfo[i][k].type === "object") {
            curClause += "%5E";
          }
          curClause = curClause + "dbo%3A" + columnInfo[i][k].value;
        }
        // After forming the path, we append the string for variable name and newline
        curClause = curClause + "+%3Fo" + optionIndex + "%7D.%0D%0A";

        // Lastly, we update optionIndex, and append curClause to optionClause
        optionIndex++;
        optionClause+=curClause;
      }
    }

    // Now we are done with optionClause, we move on to the last clause
    let endingClause = "%7D%0D%0Alimit+1&format=application%2Fsparql-results%2Bjson&timeout=30000&signal_void=on&signal_unconnected=on";

    // We now append all the clauses together
    let returnClause = prefixClause + selectClause + whereClause + optionClause + endingClause;

    // console.log(returnClause);

    // Code below is for testing
    // if (j === fillStartIndex) {
    //   console.log(prefixClause);
    //   console.log(selectClause);
    //   console.log(whereClause);
    //   console.log(optionClause);
    //   console.log(endingClause);
      // console.log(returnClause);
    // }

    // We push onto promiseArray
    if (optionClause !== "") {
      promiseArray.push(fetchJSON(returnClause));
    }
  }
  return promiseArray;
}

// This function is a helper function to support 2nd/3rd deg autofill
// Specifically, it return a 2D array of strings, as data for the 2nd/3rd deg neighbour columns
// Input: 
function processFarDeg(columnInfo, valuesAuto) {
  // First let's determine how many variables there are 
  let numVar = 0;
  for (let i = 0; i < columnInfo.length; ++i) {
    if (columnInfo[i].length === 2 || columnInfo[i].length === 3) {
      numVar++;
    }
  }

  let returnArray = [];
  for (let i = 0; i < numVar; ++i) {
    returnArray.push([]);
  }

  // Now let's loop over valuesAuto to fill our (2D) returnArray
  for (let i = 0; i < valuesAuto.length; ++i) {
    let curBinding = valuesAuto[i].results.bindings[0];
    // console.log(curBinding);
    for (let j = 0; j < numVar; ++j) {
      let curIndex = j + 1;
      let curVarName = "o" + curIndex;
      if (curBinding[curVarName] === undefined) {
        returnArray[j].push("");
      }
      else {
        let valueToAdd = curBinding[curVarName].value.includes("dbpedia.org") ? curBinding[curVarName].value.slice(28) 
                                                                              : curBinding[curVarName].value;
        returnArray[j].push(valueToAdd);
      }
    }
  }

  // Lastly we return 
  return returnArray;
}

// Helper function to automatically fill all the 2nd/3rd degree neighbours
// This function currently ignores the OR case.
function autofillFarDeg(tableDataPassed, columnInfo, valueArray, colIndex, fillStartIndex) {
  // First create a deep copy of table data
  let tableData = _.cloneDeep(tableDataPassed);

  for (let i = fillStartIndex; i < tableData.length; ++i) {
    // We first set data
    let curData = valueArray[i - fillStartIndex] === "" ? "N/A" : valueArray[i - fillStartIndex];
    tableData[i][colIndex].data = curData;
    // We then set origin
    let totalNeighbourText = "";
    for (let j = 0; j < columnInfo.length; ++j) {
      if (j > 0) {
        totalNeighbourText+="/";
      }
      let curNeighbourText = columnInfo[j].type === "object" ? "is " + columnInfo[j].value + " of" : columnInfo[j].value;
      totalNeighbourText+=curNeighbourText;
    }
    let originToAdd = totalNeighbourText + ":" + curData;
    let keyOrigin = tableData[i][0].origin.slice();
    keyOrigin.push(originToAdd);
    tableData[i][colIndex].origin = keyOrigin;
  }

  return tableData;
}

// Helper function for getting the rdf:types for the sample rows from the colIndex's column
function getRDFType(sampleData, colIndex, startingType) {
  // console.log(sampleData);
  // console.log(colIndex);

  // Now we construct a promise array to ask the queries
  // The sparql query that we will ask looks like the following:

  // select ?type
  // where {
  // dbr:Barack_Obama rdf:type ?type.
  // }

  let promiseArray = [];
  let prefixURL = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";
  let suffixURL = "format=application%2Fsparql-results%2Bjson&timeout=30000&signal_void=on&signal_unconnected=on";

  // In the case that colIndex !== -1, we are only getting the types for one column

  if (colIndex !== -1) {

    // First set up the array that contains the actual data
    let dataArray = [];
    for (let i = 0; i < sampleData.length; ++i) {
      dataArray.push(sampleData[i][colIndex].data);
    }
    // console.log(dataArray);

    for (let i = 0; i < dataArray.length; ++i) {
      let cellValue = dataArray[i] === "N/A" ? "NONEXISTINGSTRING" : regexReplace(dataArray[i]);
      let queryBody = "select+%3Ftype%0D%0Awhere+%7B%0D%0Adbr%3A" + cellValue + "+rdf%3Atype+%3Ftype.%0D%0A%7D%0D%0A&";
      let queryURL = prefixURL + queryBody + suffixURL;
      promiseArray.push(fetchJSON(queryURL));
    }
  }
  // Else, we need to get the types for sampleData[0].length - 1 columns
  else {

    let startingIndex = startingType === "startTable" ? 1: 0;
    // First set up the array that contains the actual data
    let dataArray = [];
    for (let j = startingIndex; j < sampleData[0].length; ++j) {
      for (let i = 0; i < sampleData.length; ++i) {
        dataArray.push(sampleData[i][j].data);
      }
    }
    // console.log(dataArray);

    for (let i = 0; i < dataArray.length; ++i) {
      let cellValue = dataArray[i] === "N/A" ? "NONEXISTINGSTRING" : regexReplace(dataArray[i]);
      let queryBody = "select+%3Ftype%0D%0Awhere+%7B%0D%0Adbr%3A" + cellValue + "+rdf%3Atype+%3Ftype.%0D%0A%7D%0D%0A&";
      let queryURL = prefixURL + queryBody + suffixURL;
      promiseArray.push(fetchJSON(queryURL));
    }
  }

  return promiseArray;
}

// Helper function to build the semantic tree for one column or a full table (when colIndex === -1)
function buildTypeRecord(sampleData, colIndex, values, startingType) {
  
  // Case one: when colIndex is not -1, we are processing info for a single column
  if (colIndex !== -1) {
    // First set up the array that contains the actual data
    let dataArray = [];
    for (let i = 0; i < sampleData.length; ++i) {
      dataArray.push(sampleData[i][colIndex].data);
    }

    // Now we set up the array that contains the types
    let typeArray = [];
    for (let i = 0; i < values.length; ++i) {
      let curBinding = values[i].results.bindings;
      let curTypeArray = [];
      curBinding = curBinding.filter(
        a => a.type.value.includes("dbpedia.org/ontology")
      );
      for (let j = 0; j < curBinding.length; ++j) {
        curTypeArray.push(curBinding[j].type.value.slice(28))
      }
      typeArray.push(curTypeArray);
    }

    // Now we create a data structure, called typeRecord
    let typeRecord = [];
    for (let i = 0; i < dataArray.length; ++i) {
      typeRecord.push(
        {
          "data": dataArray[i],
          "type": typeArray[i],
        }
      )
    }
    return typeRecord;
  }
  // Case 2: when colIndex is -1, we have to build the type record for a full table
  else {
    let startingIndex = startingType === "startTable" ? 1 : 0;
    // first we set up the dataArray for each column
    let tableDataArray = [];
    for (let j = startingIndex; j < sampleData[0].length; ++j) {
      let dataArray = [];
      for (let i = 0; i < sampleData.length; ++i) {
        dataArray.push(sampleData[i][j].data);
      }
      tableDataArray.push(dataArray);
    }
    // console.log(tableDataArray);

    // Now we set up the array that contains the tyeps
    let tableTypeArray = [];
    let curCounter = 0;
    for (let j = startingIndex; j < sampleData[0].length; ++j) {
      let typeArray = [];
      for (let i = 0; i < sampleData.length; ++i) {
        let curBinding = values[curCounter*sampleData.length + i].results.bindings;
        let curTypeArray = [];
        curBinding = curBinding.filter(
          a => a.type.value.includes("dbpedia.org/ontology")
        );
        for (let k = 0; k < curBinding.length; ++k) {
          curTypeArray.push(curBinding[k].type.value.slice(28))
        }
        typeArray.push(curTypeArray);
      }
      ++curCounter;
      tableTypeArray.push(typeArray);
    }
    // console.log(tableTypeArray);

    // In the last step, we put tableDataArray and tableTypeArray together
    let tableTypeRecord = [];
    for (let i = 0; i < tableDataArray.length; ++i) {
      let curTypeRecord = [];
      if (tableDataArray[i].length > 0 && tableDataArray[i][0] !== "") {
        for (let j = 0; j < tableDataArray[i].length; ++j) {
          curTypeRecord.push({
            "data": tableDataArray[i][j],
            "type": tableTypeArray[i][j],
          })
        }
      }
      tableTypeRecord.push(curTypeRecord);
    }

    return tableTypeRecord;
  }
}

// This is a helper function that builds the semantic tree for a table
// based on the typeRecord passed in
function tableTreePromise(typeRecord) {
  // console.log(typeRecord);

  let tablePromise = [];
  
  // Since we perform the same operations for each column, we call another helper columnTreePromise
  for (let i = 0; i < typeRecord.length; ++i) {
    let curColumnPromise = columnTreePromise(typeRecord[i]);
    tablePromise.push(curColumnPromise);
  }

  return allPromiseReady(tablePromise).then((values) => {
    return Promise.resolve(values);
  })
}

// This is a helper function for tableTreePromise
function columnTreePromise(columnRecord) {
  // console.log(columnRecord);

  let promiseArray = [];

  // For each entry in columnRecord, we need to make a query that looks like the following:

  // SELECT ?type0 ?type1 ?type2 ?type3
  // WHERE { 
  // {dbo:Person rdfs:subClassOf+ ?type0}
  // UNION
  // {dbo:Agent rdfs:subClassOf+ ?type1}
  // UNION
  // {dbo:Athlete rdfs:subClassOf+ ?type2}
  // UNION
  // {dbo:SoccerPlayer rdfs:subClassOf+ ?type3}
  // }

  for (let i = 0; i < columnRecord.length; ++i) {
    let curColumnType = columnRecord[i].type;
    // If this current entry has rdf:type, we need to ask the query
    if (curColumnType.length > 0) {
      // We start generating the query

      // First is the prefix clause, this remains the same
      let prefixClause = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=";

      // Second is the select clause
      let selectClause = "SELECT";
      for (let j = 0; j < curColumnType.length; ++j) {
        selectClause = selectClause + "+%3Ftype" + j;
      }
      selectClause += "%0D%0A";

      // Third is the whereClause
      let whereClause = "WHERE+%7B+%0D%0A";

      // Then it's the query body
      let bodyClause = "";
      for (let j = 0; j < curColumnType.length; ++j) {
        if (j > 0) {
          bodyClause += "UNION%0D%0A"
        }
        bodyClause = bodyClause + "%7Bdbo%3A" + curColumnType[j] + "+rdfs%3AsubClassOf%2B+%3Ftype" + j + "%7D%0D%0A"
      }
      bodyClause += "%7D";
      
      // Lastly is the ending clause
      let endingClause = "&format=application%2Fsparql-results%2Bjson&timeout=30000&signal_void=on&signal_unconnected=on";

      // Take a look at the clauses we have generated
      // console.log(prefixClause);
      // console.log(selectClause);
      // console.log(whereClause);
      // console.log(bodyClause);
      // console.log(endingClause);

      // We now append all the clauses together
      let returnClause = prefixClause + selectClause + whereClause + bodyClause + endingClause;
      promiseArray.push(fetchJSON(returnClause));
    }
  }
  // return promiseArray;
  return allPromiseReady(promiseArray).then((values) => {
    return Promise.resolve(values);
  })
}

// This helper function builds the semantic tree for each column in the table
// based on the type lineage and typeRecord

function buildTableTree(treeValues, typeRecord) {
  // console.log(treeValues);
  // console.log(typeRecord);

  let semTree = [];

  // Each entry in treeValues contains info for a column

  // If it's empty, there's no type for this column.
  // Otherwise for each column, we find the longest typeX, where X is a number
  for (let i = 0; i < typeRecord.length; ++i) {
    semTree.push(buildColumnTree(treeValues[i], typeRecord[i]));
  }
  // console.log(semTree);
  return semTree;
}

// Helper function for buildTableTree
function buildColumnTree(values, columnType) {
  // Let's first process values
  let columnTree = [];
  let fullColumnTree = [];
  // console.log(values);
  // console.log(columnType);

  // Note, we need to make a copy of columnType, and remove those entries with empty "type" arary
  // This will make our columnType's length to be consistent with values
  let columnTypeCopy = _.cloneDeep(columnType);
  for (let i = 0; i < columnTypeCopy.length; ++i) {
    if (columnTypeCopy[i].type.length === 0) {
      columnTypeCopy.splice(i, 1);
      --i;
    }
  }

  for (let i = 0; i < values.length; ++i) {
    // Below we construct the level tree for the current CELL 
    // We use a map to track which typeX is the lowest child (farthest descendent from owl:Thing)
    let countMap = {};
    // We store the most frequent typeX: these are the longest child (which can be more than 1)
    let highestCount = 0;
    let curBinding = values[i].results.bindings;
    for (let j = 0; j < curBinding.length; ++j) {
      let curType = Object.keys(curBinding[j])[0];
      countMap[curType] = (countMap[curType] || 0) + 1;
      if (countMap[curType] > highestCount) {
        highestCount = countMap[curType];
      }
    }
    // console.log(countMap);

    // Now we store the typeX's with the highest key counts
    let highestTypes = [];
    for (let j = 0; j < Object.keys(countMap).length; ++j) {
      let curType = Object.keys(countMap)[j];
      if (countMap[curType] === highestCount) {
        highestTypes.push(curType);
      }
    }
    // console.log(highestTypes);

    // Now that we have built the countMap, we can build our tree from them
    let tempTree = [];
    for (let j = 0; j < Object.keys(countMap).length; ++j) {
      let curType = Object.keys(countMap)[j];
      let curTypeTree = [];
      for (let k = 0; k < curBinding.length; ++k) {
        if (curBinding[k][curType] !== undefined) {
          if (curBinding[k][curType].value !== "http://www.w3.org/2002/07/owl#Thing") {
            curTypeTree.push(curBinding[k][curType].value.slice(28));
          }
        }
      }
      if (curTypeTree.length > 0) {
        tempTree.push({
          "type": curType,
          "tree": curTypeTree,
        });
      }
    }

    // We now combine information from 
    // 1) highestTypes (an array of the lowest children),
    // 2) tempTree (info about all lineaage)
    // 3) columnTypeCopy[i].type
    // To create the column tree

    // We first sort tempTree by each object's "tree" field's length
    // The shorter, the higher up it is on the tree
    tempTree.sort((a, b) =>
      a.tree.length > b.tree.length ? 1 : -1
    );
    // console.log(tempTree);

    // We now fetch the lowest children using highestTypes and columnTypeCopy[i].type
    for (let j = 0; j < highestTypes.length; ++j) {
      let curHighType = Number(highestTypes[j].substring(4));
      highestTypes[j] = columnTypeCopy[i].type[curHighType];
    }
    // console.log(highestTypes);

    // We build the tree in top-down manner
    let cellTree = [];
    let typeUsed = [];
    for (let j = 0; j < tempTree.length; ++j) {
      let curLevel = [];
      for (let k = 0; k < tempTree[j].tree.length; ++k) {
        let curType = tempTree[j].tree[k];
        if (!typeUsed.includes(curType)) {
          typeUsed.push(curType);
          curLevel.push(curType);
        }
      }
      cellTree.push(curLevel);
    }
    cellTree.push(highestTypes);
    // Take a look at cellTree
    // console.log(cellTree);
    columnTree.push(cellTree);
  }

  // Finally we construct the fullColumnTree. Its difference from columnTree is that it contains info about cells w/o types
  let counter = 0;
  for (let i = 0; i < columnType.length; ++i) {
    if (columnType[i].type.length === 0) {
      fullColumnTree.push([]);
    }
    else {
      fullColumnTree.push(columnTree[counter]);
      ++counter;
    }
  }
  // console.log(fullColumnTree);

  // Now that fullColumnTree looks correct. Let's merge each cellTree in a columnTree together.
  // and store the fraction information

  // Note that combinedTree should be a 2D array
  // Each outer array (corresponding to each level) stores an array of objects with properties type and frac

  // We first get the depth of the tree, from the deepest cell tree
  let combinedTree = [];
  let maxDepth = 0;

  for (let i = 0; i < fullColumnTree.length; ++i) {
    if (fullColumnTree[i].length > maxDepth) {
      maxDepth = fullColumnTree[i].length;
    }
  }

  for (let i = 0; i < maxDepth; ++i) {
    let curLevel = {};
    for (let j = 0; j < fullColumnTree.length; ++j) {
      if (fullColumnTree[j].length > i) {
        for (let k = 0; k < fullColumnTree[j][i].length; ++k) {
          let curType = fullColumnTree[j][i][k];
          curLevel[curType] = (curLevel[curType] || 0) + 1;
        }
      }
    }
    combinedTree.push(curLevel);
  }

  // Now the tree contains counts instead of fraction, let's convert it to fraction
  let totalCount = columnType.length;
  for (let i = 0; i < combinedTree.length; ++i) {
    let curLevelMap = combinedTree[i];
    for (let j = 0; j < Object.keys(curLevelMap).length; ++j) {
      let curType = Object.keys(curLevelMap)[j];
      curLevelMap[curType] /= totalCount;
    }
  }
  return combinedTree;
}


// this following query is going to help with the recursive property recommendation

// select ?superclass where{
//   dbo:Person rdfs:subClassOf* ?superclass .
//   dbo:Actor rdfs:subClassOf* ?superclass .
// }
