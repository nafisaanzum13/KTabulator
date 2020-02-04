import React, { Component } from "react";
import InputForm from "../components/InputForm";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Dashboard from "../components/Dashboard";

import { Route, Switch, Link } from "react-router-dom";
class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      urlPasted:"",
      tablePasted:"",
      dashboardReady:false
    };
    this.handleURLPaste = this.handleURLPaste.bind(this);
    this.handleTablePaste = this.handleTablePaste.bind(this);
    this.handleDashboardClick = this.handleDashboardClick.bind(this);
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

  render() {
    const dashReady = this.state.dashboardReady;
    let middleComponent;
    if (dashReady === false) {
      middleComponent = 
        <InputForm 
          urlPasted={this.state.urlPasted}
          onURLPaste={this.handleURLPaste}
          tablePasted={this.state.tablePasted}
          onTablePaste={this.handleTablePaste}
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
          <div className="InputForm">
            {middleComponent}
          </div>
          <div className="footer">
            <Footer />
          </div>
        </div>
      </div>
    );
  }
}

// alert("Hi Friends"); This line works! I guess we can write regular js in JSX files

export default App;
