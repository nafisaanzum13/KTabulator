import React, { Component } from "react";

class UsecaseSelect extends Component {
    constructor(props) {
        super(props);
        this.handleStartTable = this.handleStartTable.bind(this);
        this.handleStartSubject = this.handleStartSubject.bind(this);
    };

    handleStartTable() {
        this.props.onStartTable();
    }

    handleStartSubject() {
        this.props.onStartSubject();
    }

    render() {
        return (
            <div>
                Choose starting point:
                <button onClick={this.handleStartTable}>Table Workspace</button>
                <button onClick={this.handleStartSubject}>Subject Workspace</button>
            </div>
        );
    }
}

export default UsecaseSelect;