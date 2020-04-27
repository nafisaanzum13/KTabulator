// import { Route, Switch, Link } from "react-router-dom";
import React, { Component } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MainBody from "../components/MainBody";

class App extends Component {

  render() {
    return (
      <div className="wrapper ">
        <div className="font-body">
          <div className="header">
            <Header />
          </div>
          <div className="mainbody">
            <MainBody />
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




