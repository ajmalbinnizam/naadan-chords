import React, { Component } from "react";
import { Link, withRouter } from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";
import { Auth } from "aws-amplify";
import { Navbar, Nav, Form, FormControl } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faSearch } from "@fortawesome/free-solid-svg-icons";
import * as urlLib from "./libs/url-lib";
import Routes from "./Routes";
import logo from './logo.svg';
import Footer from "./containers/Footer";
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);

    this.searchInput = React.createRef();

    this.state = {
      navExpanded: false,
      isAuthenticated: false,
      isAuthenticating: true,
      search: "",
      isSearchOpen: false
    };
  }

  async componentDidMount() {
    try {
      await Auth.currentSession();
      this.userHasAuthenticated(true);
    }
    catch(e) {
      if (e !== 'No current user') {
        alert(e);
      }
    }
  
    this.setState({
      isAuthenticating: false,
      search: urlLib.getUrlParameter("s")
    });
  }

  userHasAuthenticated = authenticated => {
    this.setState({ isAuthenticated: authenticated });
  }

  handleLogout = async event => {
    event.preventDefault();
    await Auth.signOut();
  
    this.userHasAuthenticated(false);
    this.closeNav();
    this.props.history.push("/");
  }

  setNavExpanded = (expanded) => {
    this.setState({
      navExpanded: expanded
    });
  }

  closeNav = () => {
    this.setState({
      navExpanded: false
    });
  }

  authenticatedOptions = () => {
    if(this.state.isAuthenticated) {
      return(
        <React.Fragment>
          <LinkContainer to="/admin">
            <a href="#/" className="nav-link" onClick={this.closeNav}>Admin</a>
          </LinkContainer>
          <a href="#/" className="nav-link" onClick={this.handleLogout}>Logout</a>
        </React.Fragment>
      );
    }
  }

  setSearch = (value) => {
    this.setState({
      search: value
    });
  }

  handleSearchSubmit = (event) => {
    event.preventDefault();
  }

  handleSearchChange = (event) => {
    this.setState({
      search: event.target.value
    });
  }

  handleSearchClick = () => {
    this.setState({
      isSearchOpen: true
    });

    setTimeout(() => {
      this.searchInput.current.focus();
    }, 0);
  }

  onSearchBlur = () => {
    this.setState({
      isSearchOpen: false
    });
  }

  handleSearchClose = () => {
    this.setSearch("");
  }

  onNavBlur = () => {
    setTimeout(() => {
      this.setState({
        navExpanded: false
      });
    }, 250);
  }

  render() {
    const childProps = {
      isAuthenticated: this.state.isAuthenticated,
      userHasAuthenticated: this.userHasAuthenticated,
      search: this.state.search,
      setSearch: this.setSearch,
      closeNav: this.closeNav
    };

    return (
      <div className="App bg-light">
        <Navbar fluid="true" expand="lg" sticky="top" variant="dark" onToggle={this.setNavExpanded} expanded={this.state.navExpanded} onBlur={this.onNavBlur}>
          <div className="container">
            <Navbar.Brand>
              <Link to="/">
                <img src={logo} alt="logo" />
                <p>NAADAN<span>CHORDS</span></p>
              </Link>
            </Navbar.Brand>
            <button className={`navbar-toggler search-button ${this.state.navExpanded ? "d-none": ""}`} onClick={this.handleSearchClick}>
              <FontAwesomeIcon icon={faSearch} />
            </button>
            <Form inline className={`search-form ${this.state.search || this.state.isSearchOpen ? 'show-search':''}`} onSubmit={this.handleSearchSubmit}>
              <FormControl type="text" placeholder="Search" className="mr-sm-2" onChange={this.handleSearchChange} value={this.state.search} onBlur={this.onSearchBlur} ref={this.searchInput} />
              <FontAwesomeIcon className="clear-search" onClick={this.handleSearchClose} icon={faTimes} />
            </Form>
            <Navbar.Toggle />
            <Navbar.Collapse className="justify-content-end">
              <Nav>
                <LinkContainer exact to="/">
                  <a href="#/" className="nav-link" onClick={this.closeNav}>Home</a>
                </LinkContainer>
                <LinkContainer exact to="/about">
                  <a href="#/" className="nav-link" onClick={this.closeNav}>About</a>
                </LinkContainer>
                <LinkContainer exact to="/request">
                  <a href="#/" className="nav-link" onClick={this.closeNav}>Request</a>
                </LinkContainer>
                { this.authenticatedOptions() }
              </Nav>
            </Navbar.Collapse>
          </div>
        </Navbar>
        <div className="container contents bg-white" onTouchStart={this.onNavBlur}>
          <Routes childProps={childProps} />
        </div>
        <Footer />
      </div>
    );
  }  
}

export default withRouter(App);