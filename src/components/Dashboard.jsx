import React, { Component } from "react";
import WorkPanel from "../components/WorkPanel";
import OriginTable from "./OriginTable";

class Dashboard extends Component {

//   constructor(props) {
//     super(props);
//     // insert more fields later
//   }

  componentDidMount() {
    // The two following lines ensure that we have the information we needed
    // alert(this.props.urlPasted);
    // alert(this.props.tablePasted);
  }

  render() {
    stringToJSON(this.props.tablePasted);
    rowFilter();
    return (
      <>
      <div className="work-panel">
          <WorkPanel 
            urlPasted={this.props.urlPasted}
            tablePasted={this.props.tablePasted}
            testRows={sampleRows} // instead of using realRows, we use sampleRows here for demo purposes
            testColumns={realCols}/>
      </div>
      <div className="origin-table">
          <OriginTable 
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
    
    let colJSON = [];  // pass this JSON as table columns to WorkPanel and OriginTable
    let rowJSON = [];  // pass this JSON as table rows to WorkPanel and OriginTable
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

// Here we filter the row data to get sampleRows

function rowFilter() {
    for (let i=0;i<realRows.length;++i) {
        if (sampleRowNames.indexOf(realRows[i].City)!==-1) {
            sampleRows.push(realRows[i]);
        }
    }
    console.log(sampleRows);
}

export default Dashboard;
