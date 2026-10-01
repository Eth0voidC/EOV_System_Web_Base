import { Outlet } from 'react-router-dom';
import HeaderStaff from '../components/HeaderStaff';

function StaffDashboard() {
  return (
    <div className="staff-layout">
      <HeaderStaff />
      <main className="dashboard-content" style={{ padding: '20px' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default StaffDashboard;