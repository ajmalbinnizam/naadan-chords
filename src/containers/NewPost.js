import React, { Component } from "react";
import { Form, Row, Col } from "react-bootstrap";
import htmlParser from "react-markdown/plugins/html-parser";
import LoaderButton from "../components/LoaderButton";
import { API } from "aws-amplify";
import ReactMarkdown from "react-markdown";
import { LinkContainer } from "react-router-bootstrap";
import TextareaAutosize from "react-autosize-textarea";
import Skeleton from "react-loading-skeleton";
import ContentParser from "./ContentParser";
import "./NewPost.css";

export default class NewPost extends Component {
  constructor(props) {
    super(props);

    this.parseHtml = htmlParser();

    this.state = {
      isLoading: null,
      title: null,
      song: null,
      album: null,
      music: null,
      content: null,
      postType: "POST",
      submitted: false
    };
  }

  validateForm() {
    if(this.state.postType === "POST") {
      return this.state.title !== null
          && this.state.content !== null
          && this.state.song !== null
          && this.state.album !== null
          && this.state.music !== null;
    } else {
      return this.state.title !== null
          && this.state.content !== null;
    }
  }

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });

    if(["song", "album"].indexOf(event.target.id) !== -1) {
      let { song, album } = this.state;

      if(event.target.id === "song") {
        song = event.target.value;
      } else {
        album = event.target.value;
      }

      let title = song + (album === null ? "" : " - " + album);

      this.setState({
        title: title
      });
    }
  }

  handleSubmit = async event => {
    event.preventDefault();
  
    this.setState({ isLoading: true, submitted: true });
  
    try {
      if(this.props.isEditMode) {
        await this.updatePost({
          title: this.state.title,
          song: this.state.song,
          album: this.state.album,
          singers: this.state.singers,
          music: this.state.music,
          content: this.state.content,
          postType: this.state.postType
        });
        this.props.history.push(`/${this.props.match.params.id}`);
      } else {
        await this.createPost({
          title: this.state.title,
          song: this.state.song,
          album: this.state.album,
          singers: this.state.singers,
          music: this.state.music,
          content: this.state.content,
          postType: this.state.postType
        });
        
        if(this.state.postType === "PAGE") {
          this.props.history.push("/admin");
        } else {
          this.props.history.push("/");
        }
      }
    } catch (e) {
      alert(e);
      this.setState({ isLoading: false });
    }
  }
  
  createPost(post) {
    return API.post("posts", "/posts", {
      body: post
    });
  }

  updatePost(post) {
    return API.put("posts", `/posts/${this.props.match.params.id}`, {
      body: post
    });
  }

  post() {
    return API.get("posts", `/posts/${this.props.match.params.id}`);
  }

  async componentDidMount() {
    window.scrollTo(0, 0);

    let { isEditMode } = this.props;
    if(isEditMode) {
      this.setState({
        isLoading: true
      });

      try {
        let post = await this.post();

        this.setState({
          title: post.title,
          song: post.song,
          album: post.album,
          singers: post.singers,
          music: post.music,
          content: post.content,
          postType: post.postType,
          isLoading: false
        });
      } catch(e) {
        console.log(e);

        this.setState({
          isLoading: false
        });
      }
    } 
  }

  renderPreviewContent = () => {
    if(this.state.postType === "PAGE") {
      return (
        <ReactMarkdown source={ this.state.content } />
      );
    } else {
      return (
        <div className="preview">
          <ContentParser post = { this.state }  />
        </div>
      );
    }
  }

  renderTitleInputs = () => {
    if(this.state.postType === "PAGE") {
      return (
        <div>
          <Form.Group controlId="title">
            <Form.Control type="text" placeholder="Title" onChange={this.handleChange} value={this.state.title} />
          </Form.Group>
        </div>
      );
    } else {
      return (
        <div>
          <Form.Group controlId="song">
            <Form.Control type="text" placeholder="Song" onChange={this.handleChange} value={this.state.song ? this.state.song : ""} />
          </Form.Group>
          <Form.Group controlId="album">
            <Form.Control type="text" placeholder="Album" onChange={this.handleChange} value={this.state.album ? this.state.album : ""} />
          </Form.Group>
          <Form.Group controlId="singers">
            <Form.Control type="text" placeholder="Singers" onChange={this.handleChange} value={this.state.singers ? this.state.singers : ""} />
          </Form.Group>
          <Form.Group controlId="music">
            <Form.Control type="text" placeholder="Music Director" onChange={this.handleChange} value={this.state.music ? this.state.music : ""} />
          </Form.Group>
        </div>
      );
    }
  }

  renderEditor(isEditMode) {
    if(isEditMode && this.state.isLoading && !this.state.submitted) {
      return(
        <Row>
          <Col>
            <Skeleton count={10} />
          </Col>
        </Row>
      )
    }
  
    return (
      <Form onSubmit={this.handleSubmit}>
        <Row>
          <Col xs={12} md={6}>
            <Form.Group>
              <Form.Control as="select" id="postType" onChange={this.handleChange} value={this.state.postType ? this.state.postType : ""}>
                <option value="POST">Post</option>
                <option value="PAGE">Page</option>
              </Form.Control>
            </Form.Group>

            { this.renderTitleInputs() }

            <TextareaAutosize placeholder="Post content" onChange={this.handleChange} value={this.state.content ? this.state.content : "" } id="content" className={`form-control ${ this.state.postType === "PAGE" ? "page" : "post"}`} style={{ minHeight: 250 }} />

            <LoaderButton
              variant="primary"
              disabled={!this.validateForm()}
              type="submit"
              isLoading={this.state.isLoading}
              text={isEditMode ? "Update" : "Create"}
              loadingText={isEditMode ? "Updating…" : "Creating…"}
            />

            <LinkContainer exact to="/admin">
              <a href="#/" className="text-primary ml-3 pt-1">Cancel</a>
            </LinkContainer>
          </Col>
          <Col xs={12} md={6}>
            <div className="preview-pane">
              <h2 className="title">{this.state.title}</h2>
              {this.state.title ? <hr /> : ''}
              {this.renderPreviewContent()}
            </div>
          </Col>
        </Row>
      </Form>
    );
  }

  render() {
    let { isEditMode } = this.props;

    return (
      <div className="NewPost">
        <h1>
          <LinkContainer exact to="/admin">
            <a href="#/" className="text-primary">Admin</a>
          </LinkContainer>
          <span> <small>&raquo;</small> {`${isEditMode? "Edit Post" : "New Post"}`}</span>
        </h1>
        <hr />
        { this.renderEditor(isEditMode) }
      </div>
    );
  }
}