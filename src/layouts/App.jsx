import React, { Component } from "react";
import InputForm from "../components/InputForm";
import Header from "../components/Header";
import Footer from "../components/Footer";

import { Route, Switch } from "react-router-dom";
class App extends Component {

  render() {
    return (
      <div className="wrapper ">
        <div className="font-body">
          <div className="header">
            <Header />
          </div>
          <div className="InputForm">
            <InputForm />
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
