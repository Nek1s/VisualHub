import React from "react"

class Header extends React.Component{
  render() {
  return (
  <header className="header">{this.props.title}{this.props.name}</header>)
}}

export default Header