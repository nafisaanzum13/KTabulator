import React, { Component } from "react";
import URLForm from "../components/URLForm";
import TaskMenu from "../components/TaskMenu";
import { Collapse, Button, CardBody, Card } from 'reactstrap';
import { FaList, FaTable } from "react-icons/fa";

class ActionPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
    }
    this.createPropertyArray = this.createPropertyArray.bind(this);
    this.createSiblingArray = this.createSiblingArray.bind(this);
    this.createTableArray = this.createTableArray.bind(this);
  }

  createTableArray(firstIndex,secondIndex) {
    const tableArray = this.props.propertyNeighbours[firstIndex].siblingArray[secondIndex].tableArray;
    let tableElement = [];
    for (let thirdIndex=0;thirdIndex<tableArray.length;++thirdIndex) {
      tableElement.push(
        <div>
            <Button
              onClick={(e) => this.props.toggleOtherTable(e,firstIndex,secondIndex,thirdIndex)}>
              Table {thirdIndex}
              <FaTable />
            </Button>
            <Collapse isOpen={tableArray[thirdIndex].isOpen}>
              <Card>
                  <CardBody>
                      <div>
                        <Button 
                          onClick={(e) => this.props.unionTable(firstIndex,secondIndex,tableArray[thirdIndex].data)}>
                          Union this table
                        </Button>
                        <div dangerouslySetInnerHTML={{__html: tableArray[thirdIndex].data.outerHTML}}></div>
                      </div>
                  </CardBody>
              </Card>
            </Collapse>
        </div>
      )
    }
    return tableElement;
  }

  createSiblingArray(firstIndex) {
    const siblingArray = this.props.propertyNeighbours[firstIndex].siblingArray;
    let siblingElement = [];
    for (let secondIndex=0;secondIndex<siblingArray.length;++secondIndex) {
      let tooltipText = "Examine tables on page "+siblingArray[secondIndex].name;
      siblingElement.push(
        <div>
            <Button
              title={tooltipText}
              onClick={(e) => this.props.toggleSibling(e,firstIndex,secondIndex)}>
              {siblingArray[secondIndex].name}
              <FaList />
            </Button>
            <Collapse isOpen={siblingArray[secondIndex].isOpen}>
              <Card>
                  <CardBody>
                      {this.createTableArray(firstIndex,secondIndex)}
                  </CardBody>
              </Card>
            </Collapse>
        </div>
      )
    }
    return siblingElement;
  }

  createPropertyArray() {
    const propertyNeighbours = this.props.propertyNeighbours;
    let propertyElement = [];
    for (let i=0;i<propertyNeighbours.length;++i) {
      // We create the text for property buttons: table index plus column names
      const predicate = propertyNeighbours[i].predicate;
      const object = propertyNeighbours[i].object;
      let propertyText = predicate+": "+object+" ";
      let tooltipText = "Show other pages with "+predicate+": "+object;
      propertyElement.push(
          <div>
              <Button 
                title={tooltipText}
                onClick={(e) => this.props.togglePropertyNeighbours(e,i)}>
                {propertyText}
                <FaList />
              </Button>
              <Collapse isOpen={this.props.propertyNeighbours[i].isOpen}>
                <Card>
                    <CardBody>
                        {this.createSiblingArray(i)}
                    </CardBody>
                </Card>
              </Collapse>
          </div>
      )
    }
    return propertyElement;
  }

  render() {
    let actionEle;
    let titleEle;

    // We first decide the content for the titleElement
    if (this.props.urlPasted === "") {
      titleEle = null;
    } 
    else if ((this.props.usecaseSelected === "") || (this.props.usecaseSelected === "exploreTable" && this.props.selectedTableIndex === -1)) {
      titleEle = 
        <div className="row">
          <h3 className="col-md-4">Action List:</h3>
        </div>;
    } 
    else {
      titleEle = 
        <div className="row">
          <h3 className="col-md-4">Action List:</h3>
          <Button className="col-md-3 offset-md-4" onClick={() => this.props.copyTable()}>Copy Table</Button>
        </div>;
    }
    // Case 1: URL has not been pasted yet. User needs to paste URL here.
    if (this.props.urlPasted === "") {
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
            <button onClick={(e) => this.props.populateOtherColumn(e,actionInfo.colIndex,actionInfo.neighbour,actionInfo.neighbourIndex)}>
              OK
            </button>
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
      } else if (actionInfo.task === "showPropertyNeighbours") {
        actionEle =
          <div>
            <p>Explore relations below to look for other pages with similar tables:</p>
            {this.createPropertyArray()}
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

