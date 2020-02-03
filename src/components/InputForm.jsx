import React, { Component } from "react";
import URLForm from "../components/URLForm";
import TableForm from "../components/TableForm";

class InputForm extends Component {
  render() {
    return (
      <>
        <div className="URLForm">
          <URLForm />
        </div>
        <div className="TableForm">
          <TableForm />
        </div>
      </>
    );
  }
}

export default InputForm;
