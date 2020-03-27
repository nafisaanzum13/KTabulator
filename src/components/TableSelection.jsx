import React, { Component } from "react";
import { Collapse, Button, CardBody, Card } from 'reactstrap';
import { FaTable } from "react-icons/fa";

class TableSelection extends Component {
  constructor(props) {
    super(props);
    this.state = {
    }
    this.createButtonArray = this.createButtonArray.bind(this);
  }

  createButtonArray() {
      const originTableArray = this.props.originTableArray;
      let buttonArray = [];
      for (let i=0;i<originTableArray.length;++i) {
        // This first part create the buttons with text: table index plus column names
        // It also removes some newline characters
        let buttonText = "Table "+i+": ";
        let headerCells = originTableArray[i].rows[0].cells;
        for (let j=0;j<headerCells.length;++j) {
          let headerData = removeNewLine(headerCells[j].innerText);
          if (headerData[headerData.length-1] === "\n") {
              headerData = headerData.slice(0,-1);
          }
          buttonText = buttonText+headerData+"|";
        }
        // Now let's update the table content
        let tableContent = <div dangerouslySetInnerHTML={{__html: this.props.originTableArray[i].outerHTML}} />
        buttonArray.push(
            <div>
                <Button 
                    onClick={(e) => this.props.toggleTable(e,i)}>
                    {buttonText}
                    <FaTable />
                </Button>
                <Collapse isOpen={this.props.tableOpenList[i]}>
                <Card>
                    <CardBody>
                        {tableContent}
                    </CardBody>
                </Card>
                </Collapse>
            </div>
        )
      }
      return buttonArray;
  }

  render() {
    const numTables = this.props.originTableArray.length;
    let originTableArrayEle = null;
    if (numTables !== 0) {
        originTableArrayEle=<div>{this.createButtonArray()}</div>
    }
    return (
      <div>
        {originTableArrayEle}
      </div>
    );
  }
}

export default TableSelection;

function removeNewLine(str) {
  if (str[str.length-1] === "\n") {
    return str.slice(0,-1)
  } else {
    return str;
  }
}