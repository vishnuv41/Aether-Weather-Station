import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { ConnectionProvider } from "./context/ConnectionContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConnectionProvider>
        <App />
      </ConnectionProvider>
    </BrowserRouter>
  </React.StrictMode>
);
