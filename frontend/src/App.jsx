import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

//global Style
import './index.css';

//Import Pages
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import ProtectedRoute from './components/ProtectedRoute';

//Import Staff Views
import DashboardOverview from './components/components-staff/DashboardOverview';
import RecordsView from './components/components-staff/RecordsView';
import InventoryView from './components/components-staff/InventoryView';
import ProductView from './components/components-staff/ProductView';
import DeliveryView from './components/components-staff/DeliveryView';

function App() {
  return (
    <Router>
      <Routes>
        {/* The default route ("/") loads the Login page */}
        <Route path="/" element={<Login />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="Admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* StaffDashboard is the layout; children render inside its <Outlet /> */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRole="Staff">
              <StaffDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardOverview />} />
          <Route path="records" element={<RecordsView />} />
          <Route path="inventory" element={<InventoryView />} />
          <Route path="product" element={<ProductView />} />
          <Route path="delivery" element={<DeliveryView />} />
          <Route path="*" element={<p>Page not found</p>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;