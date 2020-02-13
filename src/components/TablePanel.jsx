import React, { Component } from "react";
import ReactTable from 'react-table-6';
import 'react-table-6/react-table.css';

class TablePanel extends Component {
    constructor(props) {
        super(props);
    };

    render() {
        let curTable;
        if (this.props.tableReady === false) {
            curTable=null;
        } else {
            curTable=
            <ReactTable 
                columns={this.props.curColumns} 
                data={this.props.curRows}>
            </ReactTable>
        }

        return (
            <>
                {curTable}
            </>
        );
    }
}

export default TablePanel;