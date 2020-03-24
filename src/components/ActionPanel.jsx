import React, { Component } from "react";
import URLForm from "../components/URLForm";
import TaskMenu from "../components/TaskMenu";

class ActionPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  render() {
    let actionEle;
    let titleEle = <h3>Action List:</h3>;
    // Case 1: URL has not been pasted yet. User needs to paste URL here.
    if (this.props.urlPasted === "") {
      titleEle = null;
      actionEle = 
        <URLForm 
          handleURLPaste={this.props.handleURLPaste}
        />
    } 
    // Case 2: URL has been pasted, but task has not been selected. User needs to select task.
    else if (this.props.usecaseSelected === "") {
      actionEle =
        <TaskMenu
          handleSelectTask={this.props.handleSelectTask}
        />
    } 
    // Case 3: curActionInfo is not null, meaning we have to display some task in ActionPanel
    else if (this.props.curActionInfo !== null) {
      const actionInfo = this.props.curActionInfo;
      if (actionInfo.task === "populateKeyColumn") {
        actionEle =
          <div>
            <p>Populate column {actionInfo.colIndex} with column header:</p>
            <p>{actionInfo.neighbour} ?</p>
            <button onClick={(e) => this.props.populateKeyColumn(e,actionInfo.colIndex,actionInfo.neighbour)}>OK</button>
          </div>
      } else if (actionInfo.task === "populateOtherColumn") {
        actionEle =
          <div>
            <p>Populate column {actionInfo.colIndex} with column header:</p>
            <p>{actionInfo.neighbour} ?</p>
            <button onClick={(e) => this.props.populateOtherColumn(e,actionInfo.colIndex,actionInfo.neighbour)}>OK</button>
          </div>
      } else if (actionInfo.task === "contextCellOrigin") {
        actionEle =
          <div>
            <p>Origin of selected cell is:</p>
            <p>{actionInfo.origin}</p>
          </div>
      } else if (actionInfo.task === "selectTableIndex") {
        actionEle =
          <div>
            <p>Select table {actionInfo.tableIndex}?</p>
            <button onClick={(e) => this.props.onSelectTable(e,actionInfo.tableIndex)}>OK</button>
          </div>
      }
    }
    else {

    }
    return (
      <div>
        {titleEle}
        {actionEle}
      </div>
    );
  }
}

export default ActionPanel;

