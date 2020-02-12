import React, { Component } from "react";

class NeighbourPanel extends Component {
    constructor(props) {
        super(props);
        this.handleExploreNeighbour = this.handleExploreNeighbour.bind(this);
    };

    handleExploreNeighbour() {
        this.props.onExploreNeighbour();
    }

    render() {
        let curExplore = null;
        let curNeighbour = null;
        const showTable = this.props.showTable;
        const showNeighbour = this.props.showNeighbour;
        if (showTable === true) {
            curExplore = <button onClick={this.handleExploreNeighbour}>Explore Neighbour: Berlin</button>
            if (showNeighbour === true) {
                curNeighbour = this.props.neighbourFound;
            }
        }
        return (
            <>
                <p>Explore Neighbours:</p>
                {curExplore}
                {curNeighbour}
            </>
        );
    }
}

export default NeighbourPanel;