import React, { Component } from "react";
import ReactTable from 'react-table-6';
import 'react-table-6/react-table.css';

class TablePanel extends Component {
    constructor(props) {
        super(props);
    };

    render() {
        let curTable;
        if (this.props.usecaseSelected === "") {
            curTable=null
        } else if (this.props.usecaseSelected === "startTable") {
            curTable=
            <ReactTable 
                columns={this.props.curColumns} 
                data={this.props.curRows}>
            </ReactTable>
        } else {
            const subject = this.props.urlPasted.slice(30)
            curTable=<p>The subject of interest is: {subject}</p>
        }

        return (
            <>
                {curTable}
            </>
        );
    }
}

export default TablePanel;