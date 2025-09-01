import { BrowserRouter as Router, Routes, Route } from "react-router-dom" 
import "./App.css"

// Pages
import HomePage from "./pages/Homepage"
import BrowseSkillsPage from "./pages/BrowseSkillsPage"
import PublishSkillPage from "./pages/PublishSkillPage"
import DashboardPage from "./pages/DashboardPage"
import SkillDetailPage from "./pages/SkillDetailPage"
import Login from "./pages/Login"
import Signup from "./pages/Signup"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/browse" element={<BrowseSkillsPage />} />
        <Route path="/publish" element={<PublishSkillPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/skills/:id" element={<SkillDetailPage />} />
        <Route path="/login" element={<Login/>} />
        <Route path="/signup" element={<Signup/>} />

      </Routes>
      
    </Router>
  )
}
