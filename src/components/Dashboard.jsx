import React, { Component } from "react";
class Dashboard extends Component {
  state = { count: 0 };
  render() {
    return (
      <div className="row">
        <div className="col-md-6 offset-md-2">
          <h1>count: {this.formatCode()}</h1>
          <button onClick={this.handleClick}>Increment</button>
        </div>
      </div>
    );
  }
  handleClick = () => {
    this.setState({ count: this.state.count + 1 });
  };

  formatCode() {
    const { count } = this.state;
    return count === 0 ? "Zero" : count;
  }
}

export default Dashboard;
