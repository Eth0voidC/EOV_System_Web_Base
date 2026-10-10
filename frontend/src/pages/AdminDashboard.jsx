import { Outlet } from 'react-router-dom';
import SidebarAdmin from '../components/components-admin/SidebarAdmin';

function AdminDashboard() {
    return (
        <div className="admin-layout" style={{ display: 'flex' }}>
            <SidebarAdmin />
            <main className="admin-content" style={{ flex: 1, minWidth: 0, padding: 'clamp(10px, 2vw, 20px)' }}>
                <Outlet />
            </main>
        </div>
    );
}

export default AdminDashboard;