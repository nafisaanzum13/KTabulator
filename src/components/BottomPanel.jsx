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
        let content;
        if (this.props.usecaseSelected === "startTable") {
          content = 
            <ReactTable columns={this.props.originColumns} data={this.props.originRows}>
            </ReactTable>
        } else if (this.props.usecaseSelected === "startSubject") {
          content=<iframe src={this.props.urlPasted} className="col-md-10 offset-md-1 bottom-iframe"></iframe>
        } else {
          content = null
        }
        return (
          <div className="col-md-10 offset-md-1">
            {content}
          </div>
        );
    }
}

export default BottomPanel;