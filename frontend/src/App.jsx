import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

//global Style
import './index.css';

//Import Pages
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* The default route ("/") loads the Login page */}
        <Route path="/" element={<Login />} />
        
        {/* Dashboard routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/staff" element={<StaffDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;