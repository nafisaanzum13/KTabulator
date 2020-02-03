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
      if (tablePasted === "") {
        return (
          <div className="row">
            <div className="col-md-6">
              <div contentEditable='true' 
                onPaste={this.handleTablePaste}
                suppressContentEditableWarning={true}>Paste the table here</div>
            </div>
          </div>
        );
      }
      return (
        <div className="row">
          <div className="col-md-6">
            <div contentEditable='true' 
              onPaste={this.handleTablePaste}
              suppressContentEditableWarning={true}>Table has already been pasted</div>
          </div>
        </div>
      );
    }
  }
  
  export default TableForm;