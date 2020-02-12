import React, { Component } from "react";

class ActionList extends Component {
    constructor(props) {
        super(props);
        this.handleAddColumn = this.handleAddColumn.bind(this);
    };

    handleAddColumn() {
        this.props.onAddColumn();
    }

    render() {
        let curAdd = null;
        const showTable = this.props.showTable;
        if (showTable === true) {
            curAdd = <button onClick={this.handleAddColumn}>Add Column: areaTotal (City)</button>
        }
        return (
            <>
                <p>Action List:</p>
                {curAdd}
            </>
        );
    }
}

export default ActionList;