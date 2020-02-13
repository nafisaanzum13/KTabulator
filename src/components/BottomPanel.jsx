import React, { Component } from "react";
import ReactTable from 'react-table-6';
import 'react-table-6/react-table.css';

class BottomPanel extends Component {

    // constructor(props) {
    //     super(props);
    //     this.state = {
    //         testTable: []
    //     }
    // }

    componentDidMount() {
    }

    render() {
        return (
          <div className="col-md-10 offset-md-1">
            <ReactTable columns={this.props.originColumns} data={this.props.originRows}>
            </ReactTable>
          </div>
        );
    }
}

export default BottomPanel;