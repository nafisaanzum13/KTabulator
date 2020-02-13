import React, { Component } from "react";

class TableCreate extends Component {
    constructor(props) {
      super(props);
    }
  
    render() {
        const subject = this.props.urlPasted.slice(30)
      return (
        <div>
            <p>The subject of interest is: {subject}</p><br />
            <iframe src={this.props.urlPasted} className="col-md-10 offset-md-1"></iframe>
        </div>
      );
    }
  }
  
  export default TableCreate;