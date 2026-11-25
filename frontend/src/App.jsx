import { Component } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";

class AppErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="error-state">
          <h1>Let’s try that again.</h1>
          <p>
            This page encountered a problem. Reload to return to your workspace.
          </p>
          <button
            className="button button--primary"
            onClick={() => window.location.reload()}
          >
            Reload workspace
          </button>
        </main>
      );
    return this.props.children;
  }
}
export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
