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
import ContactInstructor from "./pages/ContactInstructor"
import ProtectedRoute from "./ProtectedRoute"
import EditSkillPage from './pages/EditSkills'
import PaymentSuccess from "./pages/PaymentSuccess"
// ADDED: New Page Import
import ProposeExchangePage from "./pages/ProposeExchangePage" 

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/browse" element={<BrowseSkillsPage />} />
        
        <Route element={<ProtectedRoute/>}>
          <Route path="/publish" element={<PublishSkillPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/skills/:id" element={<SkillDetailPage />} />
          <Route path="/contact" element={<ContactInstructor/>}/>
          <Route path="/skills/:id/edit" element={<EditSkillPage />} />
          <Route path="/payment-success/" element={<PaymentSuccess/>}/>
          
          {/* ADDED: New Route Definition */}
          <Route path="/propose-exchange" element={<ProposeExchangePage />} /> 
        </Route>

        {/* Auth Routes - remain outside of ProtectedRoute to allow access */}
        <Route path="/login" element={<Login/>} />
        <Route path="/signup" element={<Signup/>} />
        
      </Routes>
      
    </Router>
  )
}