import React, { Component } from "react";
import { FaPlus, FaMinus } from "react-icons/fa";

class PreviewOrigin extends Component {

  constructor(props) {
    super(props);
    this.state = {};
    this.createPreviewEle = this.createPreviewEle.bind(this);
    this.createOriginEle = this.createOriginEle.bind(this);
  }

  createPreviewEle() {
    let previewInfoExpanded = this.props.previewInfoExpanded;
    let previewInfoArray = this.props.previewInfoArray;
    // We do some preliminary error checking
    if (previewInfoExpanded.length !== previewInfoArray.length) {
      alert("Some error exists!");
    }

    // Move on to actual body of the function
    let previewEle = [];
    for (let i = 0; i < previewInfoArray.length; ++i) {
      // First case: the current previewInfoArray element's value array only has one element. We just want to show some text.
      if (previewInfoArray[i].value.length === 1) {
        previewEle.push(
          <div>
            <div className="row">
              <div className="col-md-4">
                <b>{previewInfoArray[i].key}:</b>
              </div>
              <div className="col-md-7">
                {niceRender(previewInfoArray[i].value[0])}
              </div>
            </div>
            <br />
          </div>
        )
      } 
      // Second case: the current previewInfoArray element's value array has more than one element.
      // In this case we have to check for the previewInfoExpanded's variable.
      else {
        // Subcase one: previewInfoExpanded[i] is false, which means we want to push on one element only, and show a plus button
        if (previewInfoExpanded[i] === false) {
          previewEle.push(
            <div>
              <div className="row">
                <div className="col-md-4">
                  <b>{previewInfoArray[i].key}:</b>
                </div>
                <div className="col-md-7">
                  {niceRender(previewInfoArray[i].value[0])}
                </div>
                <div className="col-md-1">
                  <button
                    className="btn btn-default"
                    onClick={(e) => this.props.togglePreviewElement(e, i)}
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
              <br />
            </div>
          )
        }
        // Subcase one: previewInfoExpanded[i] is true, which means we want to push on value.length number of elements.
        // In this case we want to give a minus, or collapse icon
        else {
          // We first push on the first element(or row), which will include the minus icon
          previewEle.push(
            <div>
              <div className="row">
                <div className="col-md-4">
                  <b>{previewInfoArray[i].key}:</b>
                </div>
                <div className="col-md-7">
                  {niceRender(previewInfoArray[i].value[0])}
                </div>
                <div className="col-md-1">
                  <button
                    className="btn btn-default"
                    onClick={(e) => this.props.togglePreviewElement(e, i)}
                  >
                    <FaMinus />
                  </button>
                </div>
              </div>
            </div>
          )
          // We then push on the subsequent values
          for (let j = 1; j < previewInfoArray[i].value.length; ++j) {
            let brEle = j === previewInfoArray[i].value.length - 1 ? <br /> : null;
            previewEle.push(
              <div>
                <div className="row">
                  <div className="offset-md-4 col-md-7">
                    {niceRender(previewInfoArray[i].value[j])}
                  </div>
                </div>
                {brEle}
              </div>
            )
          }
        }
      }
    }
    let returnEle = (
      <div>
        <p>Preview of <b>{niceRender(this.props.selectedCell.data)}</b> is:</p>
        {previewEle}
      </div>
    )
    return returnEle;
  }

  createOriginEle() {
    let originEle = [];
    for (let i = 0; i < this.props.selectedCell.origin.length; ++i) {
      originEle.push(
        <p>
          {niceRender(this.props.selectedCell.origin[i])}
        </p>
      );
    }
    let returnEle = (
      <div>
        <p>Origin of <b>{niceRender(this.props.selectedCell.data)}</b> is:</p>
        {originEle}
      </div>
    )
    return returnEle;
  }

  render() {
    // console.log(this.props.previewInfoArray);
    // console.log(this.props.previewInfoExpanded);
    // console.log(this.props.selectedCell);
    let previewEle = this.createPreviewEle();
    let originEle = this.createOriginEle();
    return (
      <div>
        {previewEle}
        <hr className="preview-origin-divider"/>
        {originEle}
      </div>
    );
  }
}

export default PreviewOrigin;

// This function renders strings in a nicer way. 
// It removes all occurence of (...), and changes all "_" to " ".

function niceRender(str) {
  return str.replace(/_\(.*?\)/g, "")
            .replace(/_/g, " ");
}
