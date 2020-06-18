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
    const subject = reverseReplace(this.props.urlPasted.slice(30));
    return (
      <div>
        <ul class="list-group list-css list-group-flush">
          <hr className="m-0"></hr>
          <li
            className="list-group-item"
            onClick={(e) => this.props.handleSelectTask(e, "startSubject")}
          >
            Start with creating a table about {subject}
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
                      selectedTableIndex={this.props.selectedTableIndex}
                      onSelectTable={this.props.onSelectTable}
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
