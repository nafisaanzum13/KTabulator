import React, { Component } from "react";

class TaskMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  render() {
    return (
      <div>
        <p>Choose one of the following tasks to get started:</p>
        <button onClick={(e) => this.props.handleSelectTask(e,"startSubject")}>Create Table from Subject</button>
        <br />
        <br />
        <button onClick={(e) => this.props.handleSelectTask(e,"exploreTable")}>Explore Table on URL</button>
        <br />
        <br />
        <button onClick={(e) => this.props.handleSelectTask(e,"startTable")}>Start from Pasted Table</button>
      </div>
    );
  }
}

export default TaskMenu;