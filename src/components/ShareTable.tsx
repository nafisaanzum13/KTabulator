import * as React from "react";
import { Component } from "react";
import Modal from "react-modal";
import { AiOutlineClose } from "react-icons/ai";
import axios from "axios";

const backendURL = "http://localhost:5000/";
const saveTableBackendURL = backendURL + "savetable/";


interface ShareTableProps {
  show: boolean;
  close: () => void;
  getTableData: () => any;
}

interface ShareTableState {
  shareableLink: string;
}

class ShareTable extends Component<ShareTableProps, ShareTableState> {
  constructor(props: ShareTableProps) {
    super(props);
    this.state = { shareableLink: "" };
  }

  getShareableLink = () => {
    const data = {data: this.props.getTableData()}
    axios
      .post(saveTableBackendURL, data)
      .then((res) => {
        const key = res.data.key;
        const shareableLink = backendURL + "?key=" + key;
        this.setState({ shareableLink: shareableLink });
      })
      .catch((err) => {
        console.log("errror", err);
      });
  };

  render() {
    return (
      <div>
        <Modal isOpen={this.props.show} className="share-table-modal">
          <div style={{ textAlign: "center", padding: "5%" }}>
            <div>
              <button
                className="btn btn-light"
                title="Get shareable link"
                onClick={() => {
                  this.getShareableLink();
                }}
              >
                Get Shareable Link
              </button>
              <button
                className="btn"
                title="Close Share Table Modal"
                onClick={() => this.props.close()}
              >
                <AiOutlineClose className="color-wrangler" />
              </button>
              <div>{this.state.shareableLink}</div>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

export default ShareTable;
