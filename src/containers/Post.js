import React, { Component } from "react";
import { Row, Col } from "react-bootstrap";
import { API } from "aws-amplify";
import Skeleton from "react-loading-skeleton";
import Moment from "react-moment";
import ReactMarkdown from "react-markdown";
import Sidebar from "./Sidebar";
import "./Post.css";

export default class Post extends Component {
  constructor(props) {
    super(props);
    this.state = {
      post: {},
      isLoading: true
    };
  }

  formatDate(date) {
    return(
      <Moment format="MMMM D, YYYY">{ date }</Moment>
    );
  }

  post() {
    if(this.props.match.params.id) {
      return API.get("posts", `/posts/${this.props.match.params.id}`);
    }
  }

  async componentDidMount() {
    try {
      const post = await this.post();
      this.setState({
        post: post,
        isLoading: false
      });
    } catch(e) {
      this.setState({
        isLoading: false
      });
      console.log(e);
    }
  }

  renderPostMeta = (post) => {
    if(post.postType === "PAGE") {
      return (
        <div>
          <h1>{ post.title }</h1>
          <hr />
        </div>
      );
    } else {
      return (
        <div>
          <h1>{ post.title }</h1>
          <small>{ this.formatDate( post.createdAt ) } <span>|</span> Posted by <a href="#/">Amit S Namboothiry</a></small>
          <hr />
        </div>
      );
    }
  }

  renderPostContent = (post) => {
    if(post.postType === "PAGE") {
      return (
        <ReactMarkdown source={ post.content } />
      );
    } else {
      return (
        <div className="content">
          { post.content }
        </div>
      );
    }
  }

  renderPost = () => {
    if(this.state.isLoading) {
      return (
        <Skeleton count={15} />
      );
    } else {
      if(this.state.post.postId) {
        let { post } = this.state;
        return (
          <div>
            { this.renderPostMeta(post) }
            { this.renderPostContent(post) }
          </div>
        );
      } else {
        return (
          <h4>No posts found!</h4>
        );
      }
    }
  }

  render() {
    return (
      <div className="Post">
        <Row>
          <Col sm={8}>
            { this.renderPost() }
          </Col>
          <Col sm={4}>
            <Sidebar />
          </Col>
        </Row>
      </div>
    );
  }
}