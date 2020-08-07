import React, { Component } from "react";
import TaskMenu from "../components/TaskMenu";
import { Collapse, Button, CardBody, Card } from "reactstrap";
import { FaList, FaTable } from "react-icons/fa";
// import TableSelection from "../components/TableSelection";
// The two following lines are for tabs
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import TableSelection from "./TableSelection";
// The two following lines are for range sliders
// import RangeSlider from "react-bootstrap-range-slider";
// import "react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css";
import FirstColSelection from "./FirstColSelection";
import OtherColSelection from "./OtherColSelection";

class ActionPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.createPropertyArray = this.createPropertyArray.bind(this);
    this.createSiblingArray = this.createSiblingArray.bind(this);
    this.createTableArray = this.createTableArray.bind(this);
    this.createRecommendArray = this.createRecommendArray.bind(this);
  }

  createTableArray(firstIndex, secondIndex) {
    const tableArray = this.props.propertyNeighbours[firstIndex].siblingArray[
      secondIndex
    ].tableArray;
    let tableElement = [];
    for (let thirdIndex = 0; thirdIndex < tableArray.length; ++thirdIndex) {
      // console.log("Hello");
      // console.log(tableArray[thirdIndex].title);
      let tableTitleText = "Table " + thirdIndex + ": ";
      for (let i = 0; i < tableArray[thirdIndex].title.length; ++i) {
        tableTitleText = tableTitleText + tableArray[thirdIndex].title[i] + "|";
      }
      tableElement.push(
        <div>
          <Button
            onClick={(e) =>
              this.props.toggleOtherTable(
                e,
                firstIndex,
                secondIndex,
                thirdIndex
              )
            }
          >
            {tableTitleText}
            <FaTable />
          </Button>
          <Collapse isOpen={tableArray[thirdIndex].isOpen}>
            <Card>
              <CardBody>
                <div>
                  <ul className="list-group list-css">
                    <li
                      className="col-md-4 list-group-item list-button list-button-backgound-pink"
                      onClick={(e) =>
                        this.props.unionTable(
                          firstIndex,
                          secondIndex,
                          tableArray[thirdIndex].data,
                          tableArray[thirdIndex].colMapping
                        )}
                    >
                      Union table
                    </li>
                  </ul>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: tableArray[thirdIndex].data.outerHTML,
                    }}
                  ></div>
                </div>
              </CardBody>
            </Card>
          </Collapse>
        </div>
      );
    }
    return tableElement;
  }

  createSiblingArray(firstIndex) {
    const siblingArray = this.props.propertyNeighbours[firstIndex].siblingArray;
    let siblingElement = [];
    let zeroDividerSet = false;
    for (
      let secondIndex = 0;
      secondIndex < siblingArray.length;
      ++secondIndex
    ) {
      let tooltipText =
        "Examine tables on page " + siblingArray[secondIndex].name;
      // let divider = null;
      let listClassSib = "list-group-item";
      if (siblingArray[secondIndex].isOpen) {
        listClassSib = "list-group-item list-with-background";
      }
      if (
        zeroDividerSet === false &&
        siblingArray[secondIndex].tableArray.length === 0
      ) {
        zeroDividerSet = true;
        // divider = (
        //   <li>
        //     <h5>
        //       Below are sibling pages on which no similar tables are found:
        //     </h5>
        //     <hr />
        //   </li>
        // );
        siblingElement.push(
          <li className="list-group-item">
            <hr />
            <h5>
              Below are sibling pages on which no similar tables are found:
            </h5>
            <hr />
          </li>
        );
      }

      siblingElement.push(
        <li 
          className={listClassSib} 
          title={tooltipText}
          // onClick={(e) =>
          //   this.props.toggleSibling(e, firstIndex, secondIndex)
          // }
        >
          <span
            onClick={(e) =>
              this.props.toggleSibling(e, firstIndex, secondIndex)
            }
          >
            {siblingArray[secondIndex].name + " "}
            <FaList />
          </span>

          <Collapse isOpen={siblingArray[secondIndex].isOpen}>
            <div>
              <ul className="list-group list-css">
                <li
                  className="col-md-4 list-group-item list-button"
                  onClick={(e) => this.props.unionPage(firstIndex, secondIndex)}
                >
                  Union from page
                </li>
              </ul>
              {this.createTableArray(firstIndex, secondIndex)}
            </div>
          </Collapse>
        </li>
      );
    }
    return (
      <ul className="list-group list-css list-group-flush">
        {" "}
        {siblingElement}{" "}
      </ul>
    );
  }

  createPropertyArray() {
    // console.log("Getting here meaning we are recreating the property array");
    const propertyNeighbours = this.props.propertyNeighbours;
    // console.log(propertyNeighbours);
    let propertyElement = [];
    for (let i = 0; i < propertyNeighbours.length; ++i) {
      // We create the text for property buttons: table index plus column names
      const predicate = propertyNeighbours[i].predicate;
      const object = propertyNeighbours[i].object;
      let propertyText = predicate + ": " + object + " ";
      let tooltipText = "Show other pages with " + predicate + ": " + object;

      let listClass = "list-group-item";
      if (this.props.propertyNeighbours[i].isOpen) {
        listClass = "list-group-item list-with-background";
      }

      propertyElement.push(
        <li class={listClass} title={tooltipText}>
          <span onClick={(e) => this.props.togglePropertyNeighbours(e, i)}>
            {propertyText}
            <FaList />
          </span>

          <Collapse isOpen={this.props.propertyNeighbours[i].isOpen}>
            <div>
              <hr />
              {/* <ul className="list-group list-css">
                <li
                  className="col-md-4 list-group-item list-button list-button-backgound-pink"
                  onClick={(e) => this.props.unionProperty(i)}
                >
                  Union from all pages
                </li>
              </ul> */}
              {this.createSiblingArray(i)}
            </div>
          </Collapse>
        </li>
      );
    }
    return (
      <ul className="list-group list-css list-group-flush">
        {propertyElement}
      </ul>
    );
  }

  // This function creates the HTML element for recommend array
  createRecommendArray(colIndex, recommendArray) {
    // console.log(recommendArray);
    let stringRecommend = [];
    let semanticRecommend = [];
    // stringRecommend and semanticRecommend are both HTML elements that should be constructed from recommend array
    for (let i = 0; i < recommendArray.length; ++i) {
      let neighbourArray = [
        {
          "value":recommendArray[i].value,
          "type":recommendArray[i].type
        }
      ]
      let recommendText = recommendArray[i].type === "subject" ? recommendArray[i].value: "is " + recommendArray[i].value + " of";
      if (recommendArray[i].relation === "string") {
        stringRecommend.push(
          <div>
            <Button
              onClick={(e) => this.props.populateRecommendation(e,
                                                                colIndex,
                                                                neighbourArray)}>
              add {recommendText}
            </Button>
          </div>
        )
      }
      else {
        semanticRecommend.push(
          <div>
            <Button
              onClick={(e) => this.props.populateRecommendation(e,
                                                                colIndex,
                                                                neighbourArray)}>
              add {recommendText}
            </Button>
          </div>
        )
      }
    }
    let returnEle = 
      <div>
        {/* <div>
          <p>String similarity recommendations:</p>
          {stringRecommend}
        </div>
        <br />
        <div>
          <p>Semantic similarity recommendations:</p>
          {semanticRecommend}
        </div> */}
        <p>Recommendations of attributes to add:</p>
        {stringRecommend}
        {semanticRecommend}
      </div>
    return returnEle;
  }

  render() {
    let actionEle;  // contains either wrangling actions or unionable tables for the action panel
    let wrapperEle; // wrapper element for actionEle. This is what we will render in the HTML.
    let titleEle;   // contains what we will display as the title for the action panel

    // We first decide the content for the titleElement
    if (
      this.props.usecaseSelected === "" 
      // ||
      // (this.props.usecaseSelected === "startTable" &&
      //   this.props.selectedTableIndex === -1)
    ) {
      titleEle = (
        <div className="row">
          <div className="col-md-8">
            <h4 className="logo-left-color">
              ACTIONS
              <span> </span>
              <span className="logo-right-color xsmall">
                Select your starting action
              </span>
            </h4>
          </div>
        </div>
      );
    } 
    else {
      titleEle = (
        <div className="row action-header">
          <div className="col-md-8">
            <h4 className="logo-left-color">
              ACTIONS
              <span> </span>
              <span className="logo-right-color xsmall">
                Select your next action
              </span>
            </h4>
          </div>
        </div>
      );
    }

    // We now decide the content for the actionElement
    // Case 1: URL has been pasted, but task has not been selected. User needs to select task.
    if (this.props.usecaseSelected === "") {
      wrapperEle = 
        <TaskMenu 
          handleStartSubject={this.props.handleStartSubject} 
          urlPasted={this.props.urlPasted}
          showTableSelection={this.props.showTableSelection}
          toggleTableSelection={this.props.toggleTableSelection}
          originTableArray={this.props.originTableArray}
          tableOpenList={this.props.tableOpenList}
          toggleTable={this.props.toggleTable}
          selectedTableIndex={this.props.selectedTableIndex}
          handleStartTable={this.props.handleStartTable}
        />;
    }
    // Case 2: Task has been selected. curActionInfo is not null, meaning we have to display some task in ActionPanel
    else if (this.props.curActionInfo !== null) {
      const actionInfo = this.props.curActionInfo;
      // Case 2.1: Users have selected "Create Table from subject".
      // We ask users to select a column header for the first column.
      if (actionInfo.task === "afterStartSubject") {
        actionEle = (
          <FirstColSelection
            firstColSelection={this.props.firstColSelection}
            firstColChecked={this.props.firstColChecked}
            firstColFilled={this.props.firstColFilled}
            toggleFirstNeighbour={this.props.toggleFirstNeighbour}
            tableHeader={this.props.tableHeader}
            keyCheckedIndex={this.props.keyCheckedIndex}
            populateKeyColumn={this.props.populateKeyColumn}
            confirmAddFirstCol={this.props.confirmAddFirstCol}
          />
        )
      }
      // Case 2.2: Users have clicked on the down arrow for non-first columns.
      // We ask users to select a column header for this column.
      else if (actionInfo.task === "showOtherColSelection") {
        actionEle = (
          <OtherColSelection
            otherColSelection={this.props.otherColSelection}
            otherColChecked={this.props.otherColChecked}
            otherCheckedIndex={this.props.otherCheckedIndex}
            toggleOtherNeighbour={this.props.toggleOtherNeighbour}
            populateOtherColumn={this.props.populateOtherColumn}
            colIndex={actionInfo.colIndex}
          />
        )
      }
      // Case 2.2: Users have click on the PLUS icon on first column's header.
      // We ask users if they want to add more entities to the first column.
      else if (actionInfo.task === "plusClicked") {
        // Start here
        actionEle = (
          <div>
            <p>Add more entities to the first column?</p>
            <button
              onClick={() => this.props.addToFirstCol()}
            >
              OK
            </button>
          </div>
        )
      }
      // In this case, we tell users they can keep wrangling by selecting column header for empty columns
      else if (actionInfo.task === "afterPopulateColumn") {
        actionEle = (
          <div>
            Fill an <b>empty column header</b> by choosing from its <b>down arrow</b>
          </div>
        )
      }
      // In this case we give user a button to allow the population of first column
      else if (actionInfo.task === "populateKeyColumn") {
        let neighbourArrayText = "";
        for (let i = 0; i < actionInfo.neighbourArray.length; ++i) {
          if (i > 0) {
            neighbourArrayText += " & ";
          }
          neighbourArrayText += actionInfo.neighbourArray[i].label;
        }
        if (neighbourArrayText !== "") {
          actionEle = (
            <div>
              <p>Fill this column with:</p>
              <p><b>{neighbourArrayText}</b> ?</p>
              <button
                onClick={(e) =>
                  this.props.populateKeyColumn(
                    e,
                    actionInfo.colIndex,
                    actionInfo.neighbourArray
                  )
                }
              >
                OK
              </button>
            </div>
          );
        }
        else {
          actionEle = (
            <div>
              <p className="suggestion-text">
                Fill the <b>first column header</b> by choosing from its <b>down arrow</b>
              </p>
            </div>
          );
        }
      } 
      // In this case we give user a button to allow the population of a new column
      else if (actionInfo.task === "populateOtherColumn") {
        let neighbourArrayText = createNeighbourText(actionInfo.neighbourArray);
        actionEle = (
          <div>
            <p>Fill this column with:</p>
            <p><b>{neighbourArrayText}</b> ?</p>
            <button
              onClick={(e) =>
                this.props.populateOtherColumn(
                  e,
                  actionInfo.colIndex,
                  actionInfo.neighbourArray,
                )
              }
            >
              OK
            </button>
          </div>
        );
      } 
      // In this case we give user a button to allow the population of same neighbour
      else if (actionInfo.task === "populateSameNeighbour") {
        let neighbourArrayText = createNeighbourText(actionInfo.neighbourArray);
        actionEle = (
          <div>
            <p>Some cells in this column contain multiple values.</p>
            <p>Expand all other values that are also</p>
            <p><b>{neighbourArrayText}</b> ?</p>
            <div className="row">
              <button
                className="col-md-4"
                onClick={(e) =>
                  this.props.sameNeighbourOneRow(
                    e,
                    actionInfo.colIndex,
                    actionInfo.neighbourArray,
                  )
                }
              >
                In One Row
              </button>
              <button
                className="offset-md-1 col-md-4"
                onClick={(e) =>
                  this.props.sameNeighbourDiffRow(
                    e,
                    actionInfo.colIndex,
                    actionInfo.neighbourArray,
                  )
                }
              >
                In Separate Rows
              </button>
            </div>
          </div>
        );
      } 
      // In this case we give user a button to allow the population of all neighbours from the same range
      else if (actionInfo.task === "populateSameRange") {
        let siblingText = "";
        let plural = "";
        for (let i = 0; i < actionInfo.siblingNeighbour.length; ++i) {
          if (i > 0) {
            siblingText += ", ";
            plural = "s";
          }
          siblingText += actionInfo.siblingNeighbour[i].value;
        }
        actionEle = (
          <div>
            <p>Add column{plural}: <b>{siblingText}</b></p>
            <p>that also has type: {actionInfo.range} ?</p>
            <button
              onClick={(e) =>
                this.props.populateSameRange(
                  e,
                  actionInfo.colIndex,
                  actionInfo.range,
                  actionInfo.siblingNeighbour
                )
              }
            >
              OK
            </button>
          </div>
        );
      } 
      // In this case we give users an array of recommended neighbours to add to the table
      else if (actionInfo.task === "populateRecommendation") {
        let recommendArray = this.createRecommendArray(actionInfo.colIndex, actionInfo.recommendArray);
        actionEle = (
          <div>
            {recommendArray}
          </div>
        )
      }
      // In this case we display the origin of selected cell
      else if (actionInfo.task === "contextCellOrigin") {
        actionEle = (
          <div>
            <p>Origin of selected cell is:</p>
            <div>{actionInfo.origin}</div>
          </div>
        );
      }
      // In this case we display the origin of selected cell
      else if (actionInfo.task === "contextCellPreview") {
      actionEle = (
        <div>
          <p>Preview of <b>{niceRender(actionInfo.cellValue)}</b> is:</p>
          <div>
            {renderPreview(actionInfo.preview)}
          </div>
        </div>
        );
      }  
    } 
    // This is an empty else clause
    else {
    }

    // Now we have to determine whether we are rendering one tab or two tabs.
    // One tab for startSubject. Two tabs for startTable.
    // console.log(this.props.usecaseSelected);

    // Modified after JOIN has been added in:
    // In the startSubject case, we will have two tab: wrangling actions, and table actions.
    // Wrangling Actions: same as before.
    // Table Actions: Union will be empty, JOIN will use the pasted URL from the beginning.

    if (this.props.usecaseSelected === "startSubject") {
      let curIndex = this.props.tabIndex;
      wrapperEle = (
        <div>
          <Tabs
            selectedIndex={curIndex}
            onSelect={(index) => this.props.handleTabSwitch(index)}
          >
            <TabList>
              <Tab>Wrangling Actions</Tab>
              <Tab>Table Actions</Tab>
            </TabList>
              <TabPanel>
                {actionEle}
              </TabPanel>
              <TabPanel>
                <div>
                  <ul class="list-group list-css list-group-flush">
                    <hr className="m-0"></hr>
                    <li
                      className="list-group-item"
                    >
                      <span 
                        onClick={(e) => this.props.toggleUnionJoin(e, "union")}
                      >
                        Union Tables from Wikipedia
                      </span>

                      <Collapse isOpen={this.props.showUnionTables}>
                        <CardBody>
                          <Card>
                            Currently, finding unionable tables for customized table is not supported.
                          </Card>
                        </CardBody>
                      </Collapse>
                    </li>
                    <li
                      className="list-group-item"
                    >
                      <span 
                        onClick={(e) => this.props.toggleUnionJoin(e, "join")}
                      >
                        Join Tables from Wikipedia
                      </span>

                      <Collapse isOpen={this.props.showJoinTables}>
                        <CardBody>
                          <Card>
                            <TableSelection 
                              originTableArray={this.props.originTableArray}
                              tableOpenList={this.props.tableOpenList}
                              toggleTable={this.props.toggleTable}
                              buttonFunction={this.props.handleJoinTable}
                              listType={"join"}
                            />
                          </Card>
                        </CardBody>
                      </Collapse>
                    </li>
                    <hr className="m-0"></hr>
                  </ul>
                </div>
              </TabPanel>
          </Tabs>
        </div>
      );
    }
    else if (this.props.usecaseSelected === "startTable") {
      // If we have not selected a table, we show both tabs, as we are fully ready.
      if (this.props.selectedTableIndex !== -1) {
        let curIndex = this.props.tabIndex;
        wrapperEle = (
          <div>
            <Tabs 
              selectedIndex={curIndex}
              onSelect={(index) => this.props.handleTabSwitch(index)}
            >
              <TabList>
                <Tab>Wrangling Actions</Tab>
                <Tab>Table Actions</Tab>
              </TabList>
              <TabPanel>
                {actionEle}
              </TabPanel>
              <TabPanel>
                <div>
                  <ul class="list-group list-css list-group-flush">
                    <hr className="m-0"></hr>
                    <li
                      className="list-group-item"
                    >
                      <span 
                        onClick={(e) => this.props.toggleUnionJoin(e, "union")}
                      >
                        Union Tables from Wikipedia
                      </span>

                      <Collapse isOpen={this.props.showUnionTables}>
                        <CardBody>
                          <Card>
                              Expand relations below to look at other pages with similar
                              tables:
                            <br /><br />
                            {this.createPropertyArray()}
                          </Card>
                        </CardBody>
                      </Collapse>
                    </li>
                    <li
                      className="list-group-item"
                    >
                      <span 
                        onClick={(e) => this.props.toggleUnionJoin(e, "join")}
                      >
                        Join Tables from Wikipedia
                      </span>

                      <Collapse isOpen={this.props.showJoinTables}>
                        <CardBody>
                          <Card>
                            <TableSelection 
                              originTableArray={this.props.originTableArray}
                              tableOpenList={this.props.tableOpenList}
                              toggleTable={this.props.toggleTable}
                              buttonFunction={this.props.handleJoinTable}
                              listType={"join"}
                            />
                          </Card>
                        </CardBody>
                      </Collapse>
                    </li>
                    <hr className="m-0"></hr>
                  </ul>
                </div>
              </TabPanel>
            </Tabs>
          </div>
        )
      }
      // Else, we have not selected a table yet. In this case, wrapperEle should be equal to actionEle
      else {  
        wrapperEle = actionEle;
      }
    }
    return (
      <div>
        <div>
          {titleEle}
        </div>
        <div>
          {wrapperEle}
        </div>
      </div>
    );
  }
}

export default ActionPanel;

// The following helper function creates HTML elements from previewInfoArray, 
// an array of key-val pairs containing the info for a cell's preview.

// It also makes use of niceRender, so that preview looks clean.

function renderPreview(previewInfoArray) {
  console.log(previewInfoArray);
  let infoEle = [];
  for (let i = 0; i < previewInfoArray.length; ++i) {
    let keyLiteral = previewInfoArray[i].key;
    // We get the first element from value Array
    let valLiteral = niceRender(previewInfoArray[i].value[0]);
    // Since we have already included thte first element, we start the index from 1
    for (let j = 1; j < previewInfoArray[i].value.length; ++j) {
      valLiteral = valLiteral + "; "+niceRender(previewInfoArray[i].value[j]);
    }
    infoEle.push(
      <p><b>{keyLiteral}</b>{":"}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}{valLiteral}</p>
    )
  }
  return infoEle;
}

// This function renders this.props.tableData[i][j].data in a nicer way. 
// It removes all occurence of (...), and changes all "_" to " ".

function niceRender(str) {
  return str.replace(/_\(.*?\)/g, "")
            .replace(/_/g, " ");
}

// This function creates neighbourArrayText from neighbourArray

function createNeighbourText(neighbourArray) {
  let neighbourArrayText = "";
  for (let i = 0; i < neighbourArray.length; ++i) {
    if (i > 0) {
      neighbourArrayText+=" OR ";
    }
    let curNeighbourText = neighbourArray[i].type === "subject" ? neighbourArray[i].value : "is " + neighbourArray[i].value + " of";
    neighbourArrayText+=curNeighbourText;
  }
  return neighbourArrayText;
}

