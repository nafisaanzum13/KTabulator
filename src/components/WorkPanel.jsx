import React, { Component } from "react";
import ReactTable from 'react-table-6';
import 'react-table-6/react-table.css';

class WorkPanel extends Component {
    constructor(props) {
      super(props);
      this.state = {
          curColumns: this.props.testColumns,
          curRows: this.props.testRows,
          showTable:false
      };
      this.handleShowTable = this.handleShowTable.bind(this);
    }

    handleShowTable() {
        this.setState({
            showTable: true
        });
    }

    render() {
        let curTable;
        if (this.state.showTable === false) {
            curTable=<p>Placeholder for Table</p>
        } else {
            curTable=
            <ReactTable 
                columns={this.state.curColumns} 
                data={this.state.curRows}>
            </ReactTable>
        }
        return (
          <div className="col-md-6">
                <button onClick={this.handleShowTable}>Show Table Below</button>
              <div>
                  {curTable}
              </div>
          </div>
        );
    }
}

export default WorkPanel;