import React from "react";
import { Switch } from "react-router-dom";
import Posts from "./containers/Posts";
import Post from "./containers/Post";
import Login from "./containers/Login";
import Admin from "./containers/Admin";
import NewPost from "./containers/NewPost";
import AppliedRoute from "./components/AppliedRoute";
import UnauthenticatedRoute from "./components/UnauthenticatedRoute";
import AuthenticatedRoute from "./components/AuthenticatedRoute";

export default ({ childProps }) =>
  <Switch>
    <AppliedRoute path="/" exact component={Posts} />
    <UnauthenticatedRoute path="/login" exact component={Login} props={childProps} />
    <AuthenticatedRoute path="/admin" exact component={Admin} props={childProps} />
    <AuthenticatedRoute path="/admin/new-post" exact component={NewPost} props={childProps} />
    <AuthenticatedRoute path="/admin/edit-post/:id" exact component={NewPost} props={{isEditMode: true, ...childProps}} />
    <AppliedRoute path="/:id" exact component={Post} />
  </Switch>;