import React, { Component } from "react";
import { Collapse, CardBody, Card } from "reactstrap";
import { FaList } from "react-icons/fa";
import TableSelection from "../components/TableSelection";

class TaskMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const subject = niceRender(reverseReplace(this.props.urlPasted.slice(30)));
    return (
      <div>
        <ul class="list-group list-css list-group-flush">
          <hr className="m-0"></hr>
          <li
            className="list-group-item"
            onClick={(e) => this.props.handleStartSubject(e, "startSubject")}
          >
            Start creating a table about {decodeURIComponent(subject)}
          </li>
          <li
            className="list-group-item"
          >
            <span 
              onClick={() => this.props.toggleTableSelection()}
            >
              Start with an existing table from page <FaList />
            </span>

            <Collapse isOpen={this.props.showTableSelection}>
              <CardBody>
                <Card>
                  <div>
                    <TableSelection
                      originTableArray={this.props.originTableArray}
                      tableOpenList={this.props.tableOpenList}
                      toggleTable={this.props.toggleTable}
                      buttonFunction={this.props.handleStartTable}
                      listType={"select"}
                    />
                  </div>
                </Card>
              </CardBody>
            </Collapse>
          </li>
          <hr className="m-0"></hr>
        </ul>
      </div>
    );
  }
}

export default TaskMenu;

// This function changes the copied text "%E2%80%93" to "-" when we copy a URL from google. 

function reverseReplace(str) {
  return str.replace(/%E2%80%93/, "–");
}

// This function renders this.props.tableData[i][j].data in a nicer way. 
// It changes"_" to " ", and removes everything after the first occurence of (

  function niceRender(str) {
    let resultStr = str;
    let bracketIndex = str.indexOf("(");
    // If ( is present in a string, we want to remove it
    // We include the -1 because usually ( is preceeded by _
    if (bracketIndex !== -1) {
      resultStr = resultStr.slice(0, bracketIndex-1);
    }
    // now we turn all "_" into " "
    return resultStr.replace(/_/g, " ");
  }
