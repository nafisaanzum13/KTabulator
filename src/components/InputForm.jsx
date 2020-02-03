import React, { Component } from "react";
import URLForm from "../components/URLForm";
import TableForm from "../components/TableForm";

class InputForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      urlPasted:"",
      tablePasted:""
    };
    this.handleURLPaste = this.handleURLPaste.bind(this);
    this.handleTablePaste = this.handleTablePaste.bind(this);
    this.handleDashboardClick = this.handleDashboardClick.bind(this);
  }

  handleURLPaste(urlPasted) {
    this.setState({
      urlPasted: urlPasted
    });
  }

  handleTablePaste(tablePasted) {
    this.setState({
      tablePasted: tablePasted
    });
  }

  handleDashboardClick() {
    const clipText = this.state.tablePasted;
    var clip = clipText.split(String.fromCharCode(13));

		for (let i=0; i<clip.length; i++) {
			clip[i] = clip[i].split(String.fromCharCode(9));
    }
    
    // Let's extract the URL without breakin the string into pieces. Also, we want to remove the urls from cells
    for (let i=0; i<clip.length; i++) {
      for (let j=0; j<clip[i].length; j++) {
        // This first part is for url extraction
        // tempCell = clip[i][j];
        // tempMatch = tempCell.match(regex);
        // if (tempMatch != null) {
        //   for (k=0; k<tempMatch.length; k++) {
        //     urlArray.push(tempMatch[k]);
        //   }
        // }
        // // This second part is for removing the url's from cells
        // clip[i][j] = clip[i][j].replace(regexSpace,"");
        console.log(clip[i][j]);
      }
    }
  }

  render() {
    return (
      <>
        <div className="URLForm">
          <URLForm 
            urlPasted={this.state.urlPasted}
            onURLPaste={this.handleURLPaste}
          />
        </div>
        <br></br>
        <div className="TableForm">
          <TableForm 
            tablePasted={this.state.tablePasted}
            onTablePaste={this.handleTablePaste}
          />
        </div>
        <br></br>
        <div className="row">
          <div className="col-md-6">
            <button onClick={this.handleDashboardClick}>Go to Dashboard</button>
          </div>
        </div>
      </>
    );
  }
}

export default InputForm;
