import React, { Component } from "react";

class TaskMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div>
        <ul class="list-group list-css list-group-flush">
          <hr className="m-0"></hr>
          <li
            className="list-group-item"
            onClick={(e) => this.props.handleSelectTask(e, "startSubject")}
          >
            Create Table from Subject
          </li>
          <li
            className="list-group-item"
            onClick={(e) => this.props.handleSelectTask(e, "exploreTable")}
          >
            Explore Table on URL
          </li>
          <li
            className="list-group-item"
            onClick={(e) => this.props.handleSelectTask(e, "startTable")}
          >
            Start from Pasted Table
          </li>
          <hr className="m-0"></hr>
        </ul>
      </div>
    );
  }
}

export default TaskMenu;
