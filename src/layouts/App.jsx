// We are starting again

import React, { Component } from "react";
import InputForm from "../components/InputForm";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Dashboard from "../components/Dashboard";
import TableCreate from "../components/TableCreate";

import { Route, Switch, Link } from "react-router-dom";
class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      urlPasted:"",
      tablePasted:"",
      dashboardReady:false,
      tableCreate:false
    };
    this.handleURLPaste = this.handleURLPaste.bind(this);
    this.handleTablePaste = this.handleTablePaste.bind(this);
    this.handleDashboardClick = this.handleDashboardClick.bind(this);
    this.handleTableCreateClick = this.handleTableCreateClick.bind(this);
  };

  handleURLPaste(urlPasted) {
    this.setState({
      urlPasted: urlPasted
    });
  }

  handleTablePaste(tablePasted) {
    this.setState({
      tablePasted: tablePasted
    });
  }

  handleDashboardClick() {
    this.setState({
      dashboardReady: true
    });
  }

  handleTableCreateClick() {
    this.setState({
      tableCreate: true
    })
  }

  render() {
    const dashReady = this.state.dashboardReady;
    const tableCreate = this.state.tableCreate;
    let middleComponent;
    if (tableCreate === true) {
      middleComponent = 
        <TableCreate
          urlPasted={this.state.urlPasted}/>;
    } else if (dashReady === false){
      middleComponent = 
        <InputForm 
          urlPasted={this.state.urlPasted}
          onURLPaste={this.handleURLPaste}
          tablePasted={this.state.tablePasted}
          onTablePaste={this.handleTablePaste}
          onTableCreateClick = {this.handleTableCreateClick}
          onDashboardClick={this.handleDashboardClick}/>
    } else {
      middleComponent = 
        <Dashboard 
          urlPasted={this.state.urlPasted}
          tablePasted={this.state.tablePasted}/>
    }
    return (
      <div className="wrapper ">
        <div className="font-body">
          <div className="header">
            <Header />
          </div>
          <div className="main-content">
            <div>
              {middleComponent}
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
