import React, { Component } from "react";
import URLForm from "../components/URLForm";
import TableForm from "../components/TableForm";

class InputForm extends Component {
  constructor(props) {
    super(props);
    this.handleDashboardClick = this.handleDashboardClick.bind(this);
  }

  handleDashboardClick() {
    this.props.onDashboardClick();
  }

  render() {
    return (
      <>
        <div className="URLForm">
          <URLForm 
            urlPasted={this.props.urlPasted}
            onURLPaste={this.props.onURLPaste}
          />
        </div>
        <br></br>
        <div className="TableForm">
          <TableForm 
            tablePasted={this.props.tablePasted}
            onTablePaste={this.props.onTablePaste}
          />
        </div>
        <br></br>
        <div className="row">
          <div className="col-md-6">
            <button onClick={this.handleDashboardClick}>Go to Dashboard</button>
          </div>
        </div>
      </>
    );
  }
}

export default InputForm;
