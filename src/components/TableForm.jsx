import React, { Component } from "react";

class TableForm extends Component {

  constructor(props) {
    super(props);
    this.handleTablePaste = this.handleTablePaste.bind(this);
  }

  handleTablePaste(e) {
    e.preventDefault();
    let tablePasted = (e.clipboardData || window.clipboardData).getData('text');
    this.props.onTablePaste(tablePasted);
  }

  render() {
      const tablePasted = this.props.tablePasted;
      let tableText;
      if (tablePasted === "") {
        tableText = "Paste the table here";
      } else {
        tableText = "Table has already been pasted";
      }
      return (
        <div className="row">
          <div className="col-md-6">
            <div contentEditable='true' 
              onPaste={this.handleTablePaste}
              suppressContentEditableWarning={true}>{tableText}</div>
          </div>
        </div>
      );
    }
  }
  
  export default TableForm;