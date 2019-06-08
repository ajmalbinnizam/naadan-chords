import React, {Component} from "react";
import {ButtonGroup, Button} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";
import "./ChordControls.css";

export default class ChordControls extends Component {
  handleTransposeClick = (transposeAmount) => {
    this.props.transposeChords(transposeAmount);
  }

  handleFontSizeClick = (sizeAmount) => {
    this.props.changeFontSize(sizeAmount);
  }

  handleScrollAmountClick = (scrollAmount) => {
    this.props.changeScrollAmount(scrollAmount);
  }

  checkFontSize = (button) => {
    if(button === "up") {
      return this.props.fontSize > 20;
    } else if(button === "down") {
      return this.props.fontSize < 12;
    }
  }

  checkScrollAmount = (button) => {
    if(button === "up") {
      return this.props.scrollAmount > 4;
    } else if(button === "down") {
      return this.props.scrollAmount < 1;
    }
  }

  computeFontAmount = () => {
    return (this.props.fontSize - 15) / 2;
  }

  render() {
    let { transposeAmount, fontSize, scrollAmount } = this.props;

    return (
      <div className={`ChordControls border bg-light ${this.props.className}`}>
        <div className="controls-container transpose-container">
          <span className="feature-label">
            TRANSPOSE <span className="amount text-primary">{transposeAmount ? transposeAmount : ''}</span>
          </span>
          <ButtonGroup className={`${transposeAmount ? 'ml-3' : '' }`}>
            <Button variant="outline-dark" onClick={() => this.handleTransposeClick(1)}>
              <FontAwesomeIcon icon={faPlus} />
            </Button>
            <Button variant="outline-dark" onClick={() => this.handleTransposeClick(-1)}>
              <FontAwesomeIcon icon={faMinus} />
            </Button>
          </ButtonGroup>
        </div>

        <div className="controls-container font-size-container">
          <span className="feature-label">
            FONT <span className="amount text-primary" key={fontSize}>{fontSize === 15 ? '' : this.computeFontAmount()}</span>
          </span>
          <ButtonGroup className={`${fontSize === 15 ? '' : 'ml-3' }`}>
            <Button variant="outline-dark" onClick={() => this.handleFontSizeClick(2)} disabled={this.checkFontSize("up")}>
              <FontAwesomeIcon icon={faPlus} />
            </Button>
            <Button variant="outline-dark" onClick={() => this.handleFontSizeClick(-2)} disabled={this.checkFontSize("down")}>
              <FontAwesomeIcon icon={faMinus} />
            </Button>
          </ButtonGroup>
        </div>

        <div className="controls-container scroll-container">
          <span className="feature-label">
            SCROLL <span className="amount text-primary">{scrollAmount ? scrollAmount : ''}</span>
          </span>
          <ButtonGroup className={`${scrollAmount ? 'ml-3' : '' }`}>
            <Button variant="outline-dark" onClick={() => this.handleScrollAmountClick(1)} disabled={this.checkScrollAmount("up")}>
              <FontAwesomeIcon icon={faPlus} />
            </Button>
            <Button variant="outline-dark" onClick={() => this.handleScrollAmountClick(-1)} disabled={this.checkScrollAmount("down")}>
              <FontAwesomeIcon icon={faMinus} />
            </Button>
          </ButtonGroup>
        </div>
      </div>
    );
  }
}