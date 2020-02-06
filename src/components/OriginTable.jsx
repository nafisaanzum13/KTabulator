import React, { Component } from "react";
import ReactTable from 'react-table-6';
import 'react-table-6/react-table.css';

class OriginTable extends Component {

    // constructor(props) {
    //     super(props);
    //     this.state = {
    //         testTable: []
    //     }
    // }

    componentDidMount() {
        // alert(this.props.tablePasted);
        // const url = "https://jsonplaceholder.typicode.com/posts";
        // fetch(url, {
        //     method:"GET"
        // }).then(response => response.json()).then(posts => {
        //     this.setState({
        //         posts:posts
        //     })
        // })
        // this.setState({
        //     testTable:testData 
        // })
    }

    render() {
        // const tableString = this.props.tablePasted; // this is the place to display the table
        return (
          <div className="col-md-6 offset-md-3">Original Table
            <ReactTable columns={this.props.testColumns} data={this.props.testData}>
            </ReactTable>
          </div>
        );
    }
}

export default OriginTable;