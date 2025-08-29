import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"
import {ClerkProvider} from "@clerk/clerk-react";

const clerk_Key=import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

//if(!clerk_Key){
  //throw new error("Key required");
  
//}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerk_Key}>
    <App />
    </ClerkProvider>
  </React.StrictMode>
)
