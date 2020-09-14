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
import PreviewOrigin from "./PreviewOrigin";

class ActionPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.createPropertyArray = this.createPropertyArray.bind(this);
    this.createSiblingArray = this.createSiblingArray.bind(this);
    this.createTableArray = this.createTableArray.bind(this);
    this.createRecommendArray = this.createRecommendArray.bind(this);
    this.createStartRecommend = this.createStartRecommend.bind(this);
    this.createCustomizedUnion = this.createCustomizedUnion.bind(this); // updated 9/13
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
                        )
                      }
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
            {niceRender(siblingArray[secondIndex].name) + " "}
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
      let propertyText =
        predicate !== "subject"
          ? predicate + ": " + object + " "
          : object + " ";
      let tooltipText = "Show other pages with " + predicate + ": " + object;

      let listClass = "list-group-item";
      if (this.props.propertyNeighbours[i].isOpen) {
        listClass = "list-group-item list-with-background";
      }

      propertyElement.push(
        <li class={listClass} title={tooltipText}>
          <span onClick={(e) => this.props.togglePropertyNeighbours(e, i)}>
            {niceRender(propertyText)}
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
    let recommendEle = [];
    // stringRecommend and semanticRecommend are both HTML elements that should be constructed from recommend array
    for (let i = 0; i < recommendArray.length; ++i) {
      let neighbourArray = [
        {
          value: recommendArray[i].value,
          type: recommendArray[i].type,
        },
      ];
      let recommendText = recommendArray[i].label;
      recommendEle.push(
        <div>
          <p>
            <Button
              onClick={(e) =>
                this.props.populateRecommendation(e, colIndex, neighbourArray)
              }
            >
              {recommendText}
            </Button>
          </p>
        </div>
      );
    }
    // Now, we also want to tell user they are adding attributes with respect to which column.
    let recommendationText = "";
    if (this.props.keyColIndex !== -1) {
      let neighbourArray = this.props.tableHeader[this.props.keyColIndex];
      recommendationText =
        this.props.keyColIndex !== 0
          ? createNeighbourText(neighbourArray)
          : "First Column";
    }
    let returnEle = (
      <div className="container">
        <p>Attribute recommendations:</p>
        <p>
          Current Search Column: <b>{recommendationText}</b>
        </p>
        {recommendEle}
      </div>
    );
    return returnEle;
  }

  // This function creates the HTML element for populateSameNeighbour
  createSameNeighbour(actionInfo) {
    let neighbourArrayText = createNeighbourText(actionInfo.neighbourArray);
    let returnEle = (
      <div className="container">
        <p>Some cells in this column contain multiple values.</p>
        <p>Expand all other values that are also</p>
        <p>
          <b>{neighbourArrayText}</b> ?
        </p>
        <div className="row">
          <Button
            className="col-md-4"
            onClick={(e) =>
              this.props.sameNeighbourOneRow(
                e,
                actionInfo.colIndex,
                actionInfo.neighbourArray
              )
            }
          >
            In One Row
          </Button>
          <Button
            className="offset-md-1 col-md-4"
            onClick={(e) =>
              this.props.sameNeighbourDiffRow(
                e,
                actionInfo.colIndex,
                actionInfo.neighbourArray
              )
            }
          >
            In Separate Rows
          </Button>
        </div>
      </div>
    );
    return returnEle;
  }

  // This function creates the starting recommendations, when actionInfo.task is showStartRecommend
  createStartRecommend() {
    console.log(this.props.curActionInfo);
    let recommendEle = [];
    let recommendArray = this.props.curActionInfo.recommendArray;
    for (let i = 0; i < recommendArray.length; ++i) {
      let neighbourArray = [
        {
          value: recommendArray[i].value,
          type: recommendArray[i].type,
        },
      ];
      let recommendText = recommendArray[i].label;
      recommendEle.push(
        <div>
          <p>
            <Button
              onClick={(e) =>
                this.props.populateStartRecommend(
                  e,
                  this.props.curActionInfo.colIndex,
                  neighbourArray
                )
              }
            >
              {recommendText}
            </Button>
          </p>
        </div>
      );
    }
    // Now, we also want to tell user they are adding attributes with respect to which column.
    let recommendationText = "";
    if (this.props.keyColIndex !== -1) {
      let neighbourArray = this.props.tableHeader[this.props.keyColIndex];
      recommendationText =
        this.props.keyColIndex !== 0
          ? createNeighbourText(neighbourArray)
          : "First Column";
    }
    let returnEle = (
      <div className="container">
        <p>Attribute recommendations:</p>
        <p>
          Current Search Column: <b>{recommendationText}</b>
        </p>
        {recommendEle}
      </div>
    );
    return returnEle;
  }

  // The following function creates the HTML element for table union, in the startSubject case.
  createCustomizedUnion() {

    // First element to create: the title (text) element
    let textEle;
    if (this.props.unionURL === "") {
      textEle = 
        <div>
          <p>
            For customized table, please paste URL below to look for tables.
          </p>
        </div>
    }
    else {
      textEle = 
        <div>
          <p>
            The following tables are from page:{" "}
            <b>
              {decodeURIComponent(this.props.unionURL.slice(30))}
            </b>
          </p>
        </div>
    }

    // Second element to create: input element to support the URL pasting.
    let formEle = 
      <div>
        <div className="row text-center">
          <div className="col-md-9 offset-md-1">
            <input
              placeholder="e.g., https://en.wikipedia.org/wiki/Canada"
              onPaste={(e) => this.props.handleUnionPaste(e)}
              className=" form-control"
            ></input>
          </div>
        </div>
        <br />
      </div>
    
    // Third element to create: TableCreation component
    let tableListEle = 
      <div>
        <TableSelection
          originTableArray={this.props.unionTableArray}
          tableOpenList={this.props.unionOpenList}
          toggleTable={this.props.toggleUnionTable}
          listType={"union"}
          buttonFunction={this.props.showUnionAlign} 
        />
      </div>

    // Finally, we create the return element.
    let returnEle = 
      <div>
        {textEle}
        {formEle}
        {tableListEle}
      </div>
    return returnEle;
  }

  render() {
    let actionEle; // contains either wrangling actions or unionable tables for the action panel
    let wrapperEle; // wrapper element for actionEle. This is what we will render in the HTML.
    let titleEle; // contains what we will display as the title for the action panel

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
              Insert Data
              <span> </span>
              {/* <span className="logo-right-color xsmall">
                Select your starting action
              </span> */}
            </h4>
          </div>
        </div>
      );
    } else {
      titleEle = (
        <div className="row action-header">
          <div className="col-md-8">
            <h4 className="logo-left-color">
              Insert Data
              <span> </span>
              {/* <span className="logo-right-color xsmall">
                Select your next action
              </span> */}
            </h4>
          </div>
        </div>
      );
    }

    // We now decide the content for the actionElement
    // Case 1: URL has been pasted, but task has not been selected. User needs to select task.
    if (this.props.usecaseSelected === "") {
      wrapperEle = (
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
        />
      );
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
            firstColText={this.props.firstColText}
            firstColFilled={this.props.firstColFilled}
            toggleFirstNeighbour={this.props.toggleFirstNeighbour}
            firstColTextChange={this.props.firstColTextChange}
            tableHeader={this.props.tableHeader}
            keyCheckedIndex={this.props.keyCheckedIndex}
            populateKeyColumn={this.props.populateKeyColumn}
            confirmAddFirstCol={this.props.confirmAddFirstCol}
          />
        );
      }
      // Case 2.2: Users have clicked on the down arrow for non-first columns.
      // We ask users to select a column header for this column.
      else if (actionInfo.task === "showOtherColSelection") {
        actionEle = (
          <OtherColSelection
            otherColSelection={this.props.otherColSelection}
            otherColChecked={this.props.otherColChecked}
            otherColText={this.props.otherColText}
            otherCheckedIndex={this.props.otherCheckedIndex}
            toggleOtherNeighbour={this.props.toggleOtherNeighbour}
            otherColTextChange={this.props.otherColTextChange}
            populateOtherColumn={this.props.populateOtherColumn}
            colIndex={actionInfo.colIndex}
          />
        );
      }
      // Case 2.2: Users have click on the PLUS icon on first column's header.
      // We ask users if they want to add more entities to the first column.
      else if (actionInfo.task === "plusClicked") {
        // We want to do an error check here: if the first column is not the current search column, we disable adding more entities to it.
        if (this.props.keyColIndex !== 0) {
          actionEle = (
            <div>
              <p>
                <b>
                  Please set the first column as the search column before adding
                  more entities to it.
                </b>
              </p>
            </div>
          );
        } else {
          actionEle = (
            <div>
              <p>Add more entities to the first column?</p>
              <Button onClick={() => this.props.addToFirstCol()}>OK</Button>
            </div>
          );
        }
      }
      // In this case, we tell users they can keep wrangling by selecting column header for empty columns
      else if (actionInfo.task === "afterPopulateColumn") {
        actionEle = (
          <div>
            <p>
              <b>Fill an empty column</b> by clicking on its <b>edit icon</b>
            </p>
            <p>OR</p>
            <p>
              <b>Add a new column</b> by clicking on a column's <b>plus icon</b>
            </p>
          </div>
        );
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
              <p>
                <b>{neighbourArrayText}</b> ?
              </p>
              <Button
                onClick={(e) =>
                  this.props.populateKeyColumn(
                    e,
                    actionInfo.colIndex,
                    actionInfo.neighbourArray
                  )
                }
              >
                OK
              </Button>
            </div>
          );
        } else {
          actionEle = (
            <div>
              <p className="suggestion-text">
                Fill the <b>first column header</b> by choosing from its{" "}
                <b>down arrow</b>
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
            <p>
              <b>{neighbourArrayText}</b> ?
            </p>
            <Button
              onClick={(e) =>
                this.props.populateOtherColumn(
                  e,
                  actionInfo.colIndex,
                  actionInfo.neighbourArray
                )
              }
            >
              OK
            </Button>
          </div>
        );
      }
      // In this case we give user a button to allow the population of same neighbour
      else if (actionInfo.task === "populateSameNeighbour") {
        actionEle = this.createSameNeighbour(actionInfo);
      }
      // In this case we give users an array of recommended neighbours to add to the table
      else if (actionInfo.task === "populateRecommendation") {
        let recommendArray = this.createRecommendArray(
          actionInfo.colIndex,
          actionInfo.recommendArray
        );
        actionEle = <div>{recommendArray}</div>;
      }
      // In this case we have to include both populateSameNeighbour and populateRecommendation
      else if (actionInfo.task === "sameNeighbourAndRecommendation") {
        let sameNeighbourEle = this.createSameNeighbour(actionInfo);
        let recommendEle = this.createRecommendArray(
          actionInfo.colIndex,
          actionInfo.recommendArray
        );
        actionEle = (
          <div>
            <Card className="action-panel-card">{recommendEle}</Card>
            <br />
            <Card className="action-panel-card">{sameNeighbourEle}</Card>
          </div>
        );
      }
      // In this case we give user four column filter methods: sort asc, sort des, filter, and dedup
      else if (actionInfo.task === "showFilterMethods") {
        let textEle = null;
        if (actionInfo.colIndex === 0) {
          textEle = (
            <p>
              <b>How would you like to process the first column?</b>
            </p>
          );
        } else {
          textEle = (
            <p>
              <b>
                How would you like to process column{" "}
                {createNeighbourText(
                  this.props.tableHeader[actionInfo.colIndex]
                )}{" "}
                ?
              </b>
            </p>
          );
        }
        // console.log(textEle);
        actionEle = (
          <div>
            <div>{textEle}</div>
            <div>
              <Button
                onClick={(e) =>
                  this.props.contextSortColumn(
                    e,
                    actionInfo.colIndex,
                    "ascending"
                  )
                }
              >
                Sort ascending
              </Button>
            </div>
            <br />
            <div>
              <Button
                onClick={(e) =>
                  this.props.contextSortColumn(
                    e,
                    actionInfo.colIndex,
                    "descending"
                  )
                }
              >
                Sort descending
              </Button>
            </div>
            <br />
            <div>
              <Button
                onClick={(e) => this.props.openFilter(e, actionInfo.colIndex)}
              >
                Filter this column
              </Button>
            </div>
            <br />
            <div>
              <Button
                onClick={(e) =>
                  this.props.contextDedupColumn(e, actionInfo.colIndex)
                }
              >
                Dedup this column
              </Button>
            </div>
          </div>
        );
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
      else if (actionInfo.task === "originPreviewPage") {
        actionEle = (
          // <div>
          //   <div>
          //     <p>Preview of <b>{niceRender(actionInfo.cellValue)}</b> is:</p>
          //     <div>
          //       {renderPreview(actionInfo.preview)}
          //     </div>
          //   </div>
          //   <hr className="preview-origin-divider"/>
          //   <div>
          //     <p>Origin of <b>{niceRender(actionInfo.cellValue)}</b> is:</p>
          //     <div>{actionInfo.origin}</div>
          //   </div>
          // </div>
          <PreviewOrigin
            previewInfoArray={this.props.previewInfoArray}
            previewInfoExpanded={this.props.previewInfoExpanded}
            selectedCell={this.props.selectedCell}
            togglePreviewElement={this.props.togglePreviewElement}
          />
        );
      }
      // In this case we display the starting recommendations
      else if (actionInfo.task === "showStartRecommend") {
        let recommendEle = this.createStartRecommend();
        actionEle = <div>{recommendEle}</div>;
      }
      // In this case we have to include both populateSameNeighbour and populateStartRecommend
      else if (actionInfo.task === "sameNeighbourAndStartRecommend") {
        let sameNeighbourEle = this.createSameNeighbour(actionInfo);
        let recommendEle = this.createStartRecommend();
        actionEle = (
          <div>
            <Card className="action-panel-card">{recommendEle}</Card>
            <br />
            <Card className="action-panel-card">{sameNeighbourEle}</Card>
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

      // updated on 9/13: let's check with this.props.unionURL to decide what we want to show in the union table section



      wrapperEle = (
        <div className="height-inherit">
          <Tabs
            selectedIndex={curIndex}
            onSelect={(index) => this.props.handleTabSwitch(index)}
          >
            <TabList>
              <Tab>From DBpedia</Tab>
              <Tab>From Wiki Tables</Tab>
            </TabList>
            <div className="action-scrollable">
              <TabPanel>{actionEle}</TabPanel>
              <TabPanel>
                <div>
                  <ul class="list-group list-css list-group-flush">
                    <hr className="m-0"></hr>
                    <li className="list-group-item">
                      <span
                        onClick={(e) => this.props.toggleUnionJoin(e, "union")}
                      >
                        Union Tables from Wikipedia
                      </span>

                      <Collapse isOpen={this.props.showUnionTables}>
                        <CardBody>
                          <Card>
                            {this.createCustomizedUnion()}
                          </Card>
                        </CardBody>
                      </Collapse>
                    </li>
                    <li className="list-group-item">
                      <span
                        onClick={(e) => this.props.toggleUnionJoin(e, "join")}
                      >
                        Join Tables from Wikipedia
                      </span>

                      <Collapse isOpen={this.props.showJoinTables}>
                        <CardBody>
                          <Card>
                            <p>
                              The following tables are from page:{" "}
                              <b>
                                {decodeURIComponent(
                                  this.props.urlPasted.slice(30)
                                )}
                              </b>
                            </p>
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
            </div>
          </Tabs>
        </div>
      );
    } 
    else if (this.props.usecaseSelected === "startTable") {
      // If we have not selected a table, we show both tabs, as we are fully ready.
      if (this.props.selectedTableIndex !== -1) {
        let curIndex = this.props.tabIndex;
        wrapperEle = (
          <div className="height-inherit">
            <Tabs
              selectedIndex={curIndex}
              onSelect={(index) => this.props.handleTabSwitch(index)}
              className="height-inherit"
            >
              <TabList>
                <Tab>From DBpedia</Tab>
                <Tab>From Wiki Tables</Tab>
              </TabList>
              <div className="action-scrollable">
                <TabPanel>{actionEle}</TabPanel>
                <TabPanel>
                  <div>
                    <ul class="list-group list-css list-group-flush">
                      <hr className="m-0"></hr>
                      <li className="list-group-item">
                        <span
                          onClick={(e) =>
                            this.props.toggleUnionJoin(e, "union")
                          }
                        >
                          Union Tables from Wikipedia
                        </span>

                        <Collapse isOpen={this.props.showUnionTables}>
                          <CardBody>
                            <Card>
                              Expand relations below to look at other pages with
                              similar tables:
                              <br />
                              {this.createPropertyArray()}
                            </Card>
                          </CardBody>
                        </Collapse>
                      </li>
                      <li className="list-group-item">
                        <span
                          onClick={(e) => this.props.toggleUnionJoin(e, "join")}
                        >
                          Join Tables from Wikipedia
                        </span>

                        <Collapse isOpen={this.props.showJoinTables}>
                          <CardBody>
                            <Card>
                              <p>
                                The following tables are from page:{" "}
                                <b>
                                  {decodeURIComponent(
                                    this.props.urlPasted.slice(30)
                                  )}
                                </b>
                              </p>
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
              </div>
            </Tabs>
          </div>
        );
      }
      // Else, we have not selected a table yet. In this case, wrapperEle should be equal to actionEle
      else {
        wrapperEle = actionEle;
      }
    }
    return (
      <div className="height-inherit">
        <div>{titleEle}</div>
        <div className="height-inherit">{wrapperEle}</div>
      </div>
    );
  }
}

export default ActionPanel;

// // The following helper function creates HTML elements from previewInfoArray,
// // an array of key-val pairs containing the info for a cell's preview.

// // It also makes use of niceRender, so that preview looks clean.

// function renderPreview(previewInfoArray) {
//   // console.log(previewInfoArray);
//   let infoEle = [];
//   for (let i = 0; i < previewInfoArray.length; ++i) {
//     let keyLiteral = previewInfoArray[i].key;
//     // We get the first element from value Array
//     let valLiteral = niceRender(previewInfoArray[i].value[0]);
//     // Since we have already included thte first element, we start the index from 1
//     for (let j = 1; j < previewInfoArray[i].value.length; ++j) {
//       valLiteral = valLiteral + "; "+niceRender(previewInfoArray[i].value[j]);
//     }
//     infoEle.push(
//       <p><b>{keyLiteral}</b>{":"}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}{valLiteral}</p>
//     )
//   }
//   return infoEle;
// }

// // This function renders this.props.tableData[i][j].data in a nicer way.
// // It removes all occurence of (...), and changes all "_" to " ".

// function niceRender(str) {
//   return str.replace(/_\(.*?\)/g, "")
//             .replace(/_/g, " ");
// }

// This function creates neighbourArrayText from neighbourArray

function createNeighbourText(neighbourArray) {
  let neighbourArrayText = "";
  for (let i = 0; i < neighbourArray.length; ++i) {
    if (i > 0) {
      neighbourArrayText += " OR ";
    }
    let curNeighbourText =
      neighbourArray[i].type === "object"
        ? "is " + neighbourArray[i].value + " of"
        : neighbourArray[i].value;
    neighbourArrayText += curNeighbourText;
  }
  return neighbourArrayText;
}

// This function renders this.props.tableData[i][j].data in a nicer way.
// It removes all occurence of (...), and changes all "_" to " ".

function niceRender(str) {
  return str.replace(/_\(.*?\)/g, "").replace(/_/g, " ");
}
