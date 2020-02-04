import React, { Component } from "react";

class Dashboard extends Component {

  constructor(props) {
    super(props);
    this.handleSeeTable = this.handleSeeTable.bind(this);
  }

  handleSeeTable() {
      alert(this.props.tablePasted);
  }

  render() {
    return (
      <div className="row">
        <div className="col-md-6">
            <button onClick={this.handleSeeTable}>Click to see table</button>
        </div>
      </div>
    );
  }
}
  
  export default Dashboard;