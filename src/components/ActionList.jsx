import React, { Component } from "react";

class ActionList extends Component {
    constructor(props) {
        super(props);
        this.handleAddColumn = this.handleAddColumn.bind(this);
    };

    handleAddColumn(e, colName) {
        this.props.onAddColumn(e, colName);
    }

    render() {
        let curAdd = null;
        const showTable = this.props.showTable;
        const addArray = this.props.columnCanAdd;
        if (showTable === true) {
            curAdd = [];
            for(let i=0;i<addArray.length;++i) {
                let tempName = "Add Column:(City) "+addArray[i];
                curAdd.push(
                <div key={tempName}>
                    <button onClick={(e) => this.handleAddColumn(e, addArray[i])}>{tempName}</button>
                </div>);
            }
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