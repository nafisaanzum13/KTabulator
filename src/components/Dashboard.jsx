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
    // alert(testData);
    return (
      <>
      <div className="work-panel">
          <WorkPanel 
            urlPasted={this.props.urlPasted}
            tablePasted={this.props.tablePasted}
            testData={testData}
            testColumns={columns}/>
      </div>
      <div className="origin-table">
          <OriginTable 
            urlPasted={this.props.urlPasted}
            tablePasted={this.props.tablePasted}
            testData={testData}
            testColumns={columns}/>
      </div>
      </>
    );
  }
}

const testData = [
    {"city":"Berlin", "country":"Germany"},
    {"city":"Toronto","country":"Canada"},
    {"city":"Paris","country":"France"},
    {"city":"Shanghai","country":"China"},
    {"city":"Waterloo","country":"Canada"},
    {"city":"Melbourne","country":"Australia"},
    {"city":"New York","country":"US"},
    {"city":"Florence","country":"Italy"}
];

const columns = [
    {
        Header:"City",
        accessor:"city"
    },
    {
        Header:"Country",
        accessor:"country"
    }
];
  
export default Dashboard;