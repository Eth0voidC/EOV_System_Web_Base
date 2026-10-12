import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

//global Style
import './index.css';

//Import Pages
import LandingPage from './pages/LandingPage';
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

//Import Admin Views
import DashboardOverviewAdmin from './components/components-admin/DashboardOverviewAdmin';
import InventoryViewAdmin from './components/components-admin/InventoryViewAdmin';
import DeliveryHistory from './components/components-admin/DeliveryHistory';
import TransactionHistory from './components/components-admin/TransactionHistory';
import DeductionProcessing from './components/components-admin/DeductionProcessing';
import Logs from './components/components-admin/Logs';
import RegisterCustomer from './components/components-admin/RegisterCustomer';
import CreateAccount from './components/components-admin/CreateAccount';

function App() {
  return (
    <Router>
      <Routes>
        {/* The default route ("/") loads the Landing Page */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />

        {/* AdminDashboard is the layout; children render inside its <Outlet /> */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="Admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardOverviewAdmin />} />
          <Route path="dashboard" element={<DashboardOverviewAdmin />} />
          <Route path="inventory" element={<InventoryViewAdmin />} />
          <Route path="reports/delivery-history" element={<DeliveryHistory />} />
          <Route path="reports/transaction-history" element={<TransactionHistory />} />
          <Route path="reports/deduction-processing" element={<DeductionProcessing />} />
          <Route path="reports/logs" element={<Logs />} />
          <Route path="customer/register" element={<RegisterCustomer />} />
          <Route path="customer/create-account" element={<CreateAccount />} />
          <Route path="product" element={<ProductView />} />
          <Route path="delivery" element={<DeliveryView />} />
          <Route path="*" element={<p>Page not found</p>} />
        </Route>

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