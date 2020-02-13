import React, { Component } from "react";
import WorkPanel from "../components/WorkPanel";
import BottomPanel from "../components/BottomPanel";

class Dashboard extends Component {

  constructor(props) {
    super(props);
    this.state = {
        tableReady:false, // storing whether the table in tablePanel is ready. This is set to true when
                          // 1) User clicks on "Start From Table" 2)User clicks on "Table Ready" from "startSubject" usecase
        usecaseSelected:"" // storing which usecase we are at: "startTable" or "startSubject"
    };
    // click to go to "startTable" use case, this should also set tableReady to true
    this.handleStartTable = this.handleStartTable.bind(this); 
    this.handleStartSubject = this.handleStartSubject.bind(this);
  }

  componentDidMount() {
    // The two following lines ensure that we have the information we needed
    // alert(this.props.urlPasted);
    // alert(this.props.tablePasted);
  }

  handleStartTable() {
      this.setState({
        tableReady:true, // if we start form table, then table is already ready
        usecaseSelected:"startTable"
      });
  }

  handleStartSubject() {
      this.setState({
          tableReady:false, // if we just click on start subject, then table is not ready yet
          usecaseSelected:"startSubject"
      })
  }

  render() {
    stringToJSON(this.props.tablePasted);
    rowFilter();
    return (
      <>
      <div className="work-panel">
          <WorkPanel 
            usecaseSelected={this.state.usecaseSelected}
            tableReady={this.state.tableReady}
            urlPasted={this.props.urlPasted}
            tablePasted={this.props.tablePasted}
            testRows={sampleRows} // instead of using realRows, we use sampleRows here for demo purposes
            testColumns={realCols}
            onStartTable={this.handleStartTable}
            onStartSubject={this.handleStartSubject}/>
      </div>
      <div className="bottom-panel">
          <BottomPanel 
            usecaseSelected={this.state.usecaseSelected}
            tableReady={this.state.tableReady}
            urlPasted={this.props.urlPasted}
            tablePasted={this.props.tablePasted}
            originRows={realRows} 
            originColumns={realCols}/>
      </div>
      </>
    );
  }
}

// Here we initialize some variables

var sampleDone = false;
var realRows = [];
var realCols = [];
var sampleRows = [];
var sampleRowNames = ["Singapore","Paris","Taipei","Reykjavík","Rome","Dhaka",
                    "Ankara","Abuja","Ottawa","London","Madrid","Tokyo",
                    "Cairo","Beijing","Berlin"];

// Here we begin the conversion from String(tablePasted) to JSON format that is desired.

var urlArray = [];

function stringToJSON(tablePasted) {
    const regex = /(\(https.*?\))/g;     // this regular expression matches all strings of form "(https....)"
    const regexSpace = /(\s\(https.*?\))/g;  // this regular expression matches all string of form " (https....)"
    
    let colJSON = [];  // pass this JSON as table columns to WorkPanel and BottomPanel
    let rowJSON = [];  // pass this JSON as table rows to WorkPanel and BottomPanel
    let clipText = tablePasted; 
    let clip = clipText.split("\n");

    for (let i=0; i<clip.length; i++) {
        clip[i] = clip[i].split(String.fromCharCode(9));
    }

    // First, let's get the column names from row clip[0]. Expected output should be a list of
    // three objects, each object with keys "Header" and "accessor". This is the colJSON

    for (let j=0;j<clip[0].length;++j) {
        let tempHeader = {Header:clip[0][j],accessor:clip[0][j]};
        colJSON.push(tempHeader);
    }
    // console.log(colJSON);
    // Getting colJSON is successful. We need to get rowJSON too

    // Let's covert each row into a simple JSON object, and add to rowJSON

    for (let i=1;i<clip.length;++i) {
        let tempObj = {};
        for (let j=0;j<clip[0].length;++j) {

            // In this loop we are working with each cell of a row
            let tempCell = clip[i][j];

            // Then, for each cell in the row, we extract the URL
            let tempMatch = tempCell.match(regex);
            if (tempMatch != null) {
                for (let k=0; k<tempMatch.length; k++) {
                    // instead of logging the URL's in the console, we want to associate the URL
                    // with each cell. Create another object for this task.
                    // rowJSON should be a list of objects, each object is simple, representing a row
                    // We may want to make cells into objects too, then each row would be a list of cell objects
                    // But let's handle this issue later
                    // console.log(tempMatch[k]);
                }
            }
            // The following lines are for removing the url strings from cells, and add in key-val pair to row obj
            tempCell = tempCell.replace(regexSpace,"");
            tempObj[clip[0][j]] = tempCell;
        }
        rowJSON.push(tempObj);
    }
    realRows = rowJSON;
    realCols = colJSON;
    //console.log(realRows);
    //console.log(realCols);
}

// Here we filter the row data to get sampleRows. We have to prevent this function being called multiple times though

function rowFilter() {
    if (sampleDone === false) {
        for (let i=0;i<realRows.length;++i) {
            if (sampleRowNames.indexOf(realRows[i].City)!==-1) {
                sampleRows.push(realRows[i]);
            }
        }
        sampleDone = true;
    }
}

export default Dashboard;
