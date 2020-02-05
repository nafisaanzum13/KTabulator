import React, { Component } from "react";
import WorkPanel from "../components/WorkPanel";
import OriginTable from "./OriginTable";

class Dashboard extends Component {

  constructor(props) {
    super(props);
    // insert more fields later
  }

  componentDidMount() {
    // The two following lines ensure that we have the information we needed
    alert(this.props.urlPasted);
    alert(this.props.tablePasted);
  }

  render() {
    return (
      <>
      <div className="work-panel">
          <WorkPanel />
      </div>
      <div className="origin-table">
          <OriginTable />
      </div>
      </>
    );
  }
}
  
  export default Dashboard;