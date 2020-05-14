import React, { Component } from "react";
import TaskMenu from "../components/TaskMenu";
import { Collapse, Button, CardBody, Card } from 'reactstrap';
import { FaList, FaTable } from "react-icons/fa";
// The two following lines are for tabs
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
// The two following lines are for range sliders
import RangeSlider from 'react-bootstrap-range-slider';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css'

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
      // console.log("Hello");
      // console.log(tableArray[thirdIndex].title);
      let tableTitleText = "Table "+thirdIndex+": ";
      for (let i=0;i<tableArray[thirdIndex].title.length;++i) {
        tableTitleText = tableTitleText+tableArray[thirdIndex].title[i]+"|";
      }
      tableElement.push(
        <div>
            <Button
              onClick={(e) => this.props.toggleOtherTable(e,firstIndex,secondIndex,thirdIndex)}>
              {tableTitleText}
              <FaTable />
            </Button>
            <Collapse isOpen={tableArray[thirdIndex].isOpen}>
              <Card>
                  <CardBody>
                      <div>
                        <button 
                          onClick={(e) => this.props.unionTable(firstIndex,secondIndex,tableArray[thirdIndex].data,tableArray[thirdIndex].colMapping)}>
                          Union this table
                        </button>
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
    let zeroDividerSet = false;
    for (let secondIndex=0;secondIndex<siblingArray.length;++secondIndex) {
      let tooltipText = "Examine tables on page "+siblingArray[secondIndex].name;
      let divider = null;
      if (zeroDividerSet === false && siblingArray[secondIndex].tableArray.length === 0) {
        zeroDividerSet = true;
        divider = 
          <div>
            <hr />
            <p>Below are sibling pages on which no similar tables are found:</p>
          </div>
      }
      siblingElement.push(
        <div>
            {divider}
            <Button
              title={tooltipText}
              onClick={(e) => this.props.toggleSibling(e,firstIndex,secondIndex)}>
              {siblingArray[secondIndex].name}
              <FaList />
            </Button>
            <Collapse isOpen={siblingArray[secondIndex].isOpen}>
              <Card>
                  <CardBody>
                    <button 
                      onClick={(e) => this.props.unionPage(firstIndex,secondIndex)}>
                      Union all tables from page
                    </button>
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
                      <button 
                        onClick={(e) => this.props.unionProperty(i)}>
                        Union tables from all pages
                      </button>
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
    if ((this.props.usecaseSelected === "") || (this.props.usecaseSelected === "exploreTable" && this.props.selectedTableIndex === -1)) {
      titleEle = 
        <div className="row">
          <h3 className="col-md-4">Action List:</h3>
        </div>;
    } 
    else {
      titleEle = 
        <div className="row">
          <h3 className="col-md-4">Action List:</h3>
          <button className="col-md-3 offset-md-4" onClick={() => this.props.copyTable()}>Copy Table</button>
        </div>;
    }

    // We now decide the content for the actionElement
    // Case 1: URL has been pasted, but task has not been selected. User needs to select task.
    if (this.props.usecaseSelected === "") {
      actionEle =
        <TaskMenu
          handleSelectTask={this.props.handleSelectTask}
        />
    } 
    // Case 2: curActionInfo is not null, meaning we have to display some task in ActionPanel
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
        let neighbourText = actionInfo.type==="subject"?actionInfo.neighbour:"is "+actionInfo.neighbour+" of";
        actionEle =
          <div>
            <p>Populate column {actionInfo.colIndex} with column header:</p>
            <p>{neighbourText} ?</p>
            <button 
              onClick={(e) => 
                        this.props.populateOtherColumn(e,actionInfo.colIndex,actionInfo.neighbour,actionInfo.neighbourIndex,actionInfo.type)}>
              OK
            </button>
          </div>
      } else if (actionInfo.task === "populateSameNeighbour") {
        let neighbourText = actionInfo.type==="subject"?actionInfo.neighbour:"is "+actionInfo.neighbour+" of";
        actionEle =
          <div>
            <p>Populate all other properties with name:</p>
            <p>{neighbourText} ?</p>
            <div className="row">
              <button
                className="col-md-4"
                onClick={(e) => 
                  this.props.sameNeighbourOneCol(e,actionInfo.colIndex,actionInfo.neighbour,
                                                actionInfo.neighbourIndex,actionInfo.type,actionInfo.numCols)}>
                In One Column
              </button>
              <button 
                className="offset-md-1 col-md-4"
                onClick={(e) => 
                          this.props.sameNeighbourDiffCol(e,actionInfo.colIndex,actionInfo.neighbour,
                                                        actionInfo.neighbourIndex,actionInfo.type,actionInfo.numCols)}>
                In Separate Columns
              </button>
            </div>
          </div>
      } else if (actionInfo.task === "contextCellOrigin") {
        actionEle =
          <div>
            <p>Origin of selected cell is:</p>
            <div>{actionInfo.origin}</div>
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
            <Tabs>
              <TabList>
                  <Tab>View Results</Tab>
                  <Tab>Change Setting</Tab>
              </TabList>
              <TabPanel>
                <p>Explore relations below to look for other pages with similar tables:</p>
                {this.createPropertyArray()}
              </TabPanel>
              <TabPanel>
                  <div className="row">
                    <div className="col-md-4">
                      Semantic Mapping:
                    </div>
                    <div className="col-md-6">
                      <div onChange={(e) => this.props.toggleSemantic(e)}>
                        <input type="radio" value="enabled" checked={this.props.semanticEnabled === "enabled"}/> Enabled
                        <input type="radio" value="disabled" checked={this.props.semanticEnabled === "disabled"}/> Disabled
                      </div>
                    </div>
                  </div>
                  <br />
                  <div className="row">
                    <div className="col-md-4">
                      Union Cutoff Percentage:
                    </div>
                    <div className="col-md-6">
                      <RangeSlider
                        value={this.props.unionCutOff}
                        onChange={(e) => this.props.unionCutOffChange(e)}
                        min={0}
                        max={1}
                        step={0.05}
                      />
                    </div>
                  </div>
              </TabPanel>
            </Tabs>
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

