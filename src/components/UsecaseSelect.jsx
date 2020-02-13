import React, { Component } from "react";

class UsecaseSelect extends Component {
    constructor(props) {
        super(props);
        this.handleShowTable = this.handleShowTable.bind(this);
    };

    handleShowTable() {
        this.props.onShowTable();
    }

    render() {
        return (
            <div className="row col-md-6">
                <p>Choose starting point:</p>
                <button onClick={this.handleShowTable}>Show Pasted Table</button>
            </div>
        );
    }
}

export default UsecaseSelect;