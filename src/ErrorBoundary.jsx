import React from "react";
export default class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error("Music Max could not render:", error);
  }
  render() {
    return this.state.failed ? (
      <div className="fatal-error">
        <h1>A brief pause.</h1>
        <p>
          Something interrupted the app. Your saved library is still on this
          device.
        </p>
        <button onClick={() => location.reload()}>Reload Music</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
