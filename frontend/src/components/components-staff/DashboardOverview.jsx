import { Link } from 'react-router-dom';

import { formatMoney } from './recordsHelpers';
import '../components-css/dashboardoverview.css';

// Temporary sample data. Later this comes from the API.
const todayTransactions = [
    { id: 1, time: '08:15 AM', employee: 'Maria Reyes', items: 3, total: 225, status: 'Paid' },
    { id: 2, time: '08:42 AM', employee: 'Mark Santos', items: 1, total: 125, status: 'Pending' },
    { id: 3, time: '09:05 AM', employee: 'John Dela Cruz', items: 4, total: 410, status: 'Pending' },
    { id: 4, time: '09:30 AM', employee: 'Paolo Mendoza', items: 2, total: 187.5, status: 'Paid' },
    { id: 5, time: '10:10 AM', employee: 'Maria Reyes', items: 1, total: 62.5, status: 'Pending' },
    { id: 6, time: '10:45 AM', employee: 'Mark Santos', items: 5, total: 530, status: 'Paid' },
    { id: 7, time: '11:20 AM', employee: 'John Dela Cruz', items: 2, total: 150, status: 'Pending' },
];

const sampleProducts = [
    { id: 1, name: 'Product 1', stock: 0, image: '' },
    { id: 2, name: 'Product 2', stock: 3, image: '' },
    { id: 3, name: 'Product 3', stock: 8, image: '' },
    { id: 4, name: 'Product 4', stock: 15, image: '' },
    { id: 5, name: 'Product 5', stock: 18, image: '' },
    { id: 6, name: 'Product 6', stock: 60, image: '' }, // not low, so it is hidden
];

const LOW_STOCK_LIMIT = 20; // products at or below this show in the list

// Pill color and text for each stock level
const getStockLevel = (stock) => {
    if (stock === 0) return { level: 'red', label: 'Out of stock' };
    if (stock <= 5) return { level: 'red', label: `${stock} left` };
    if (stock <= 10) return { level: 'yellow', label: `${stock} left` };
    return { level: 'green', label: `${stock} left` };
};

function DashboardOverview() {
    const totalSales = todayTransactions.reduce((sum, t) => sum + t.total, 0);
    const pendingCount = todayTransactions.filter((t) => t.status === 'Pending').length;

    // Lowest stock first
    const lowStock = sampleProducts
        .filter((p) => p.stock <= LOW_STOCK_LIMIT)
        .sort((a, b) => a.stock - b.stock);

    return (
        <div className="dash-page">
            <h2 className="dash-title">Dashboard</h2>

            <div className="dash-layout">
                {/* ---------- Today's Transaction ---------- */}
                <section className="dash-panel">
                    <h3 className="dash-panel-title">Today's Transaction</h3>

                    <div className="dash-summary">
                        <div className="dash-stat">
                            <span className="dash-stat-label">Transactions</span>
                            <span className="dash-stat-value">{todayTransactions.length}</span>
                        </div>
                        <div className="dash-stat">
                            <span className="dash-stat-label">Total Sales</span>
                            <span className="dash-stat-value">{formatMoney(totalSales)}</span>
                        </div>
                        <div className="dash-stat">
                            <span className="dash-stat-label">Pending</span>
                            <span className="dash-stat-value">{pendingCount}</span>
                        </div>
                    </div>

                    <div className="dash-table-box">
                        <div className="dash-row dash-cols dash-head">
                            <span>Time</span>
                            <span>Employee</span>
                            <span>Items</span>
                            <span>Total</span>
                            <span>Status</span>
                        </div>

                        <div className="dash-list">
                            {todayTransactions.length === 0 ? (
                                <p className="dash-empty">No transactions today.</p>
                            ) : (
                                todayTransactions.map((t) => (
                                    <div className="dash-row dash-cols dash-item" key={t.id}>
                                        <span>{t.time}</span>
                                        <span className="dash-ellipsis">{t.employee}</span>
                                        <span>{t.items}</span>
                                        <span>{formatMoney(t.total)}</span>
                                        <span>
                                            <span className={`dash-badge dash-${t.status.toLowerCase()}`}>
                                                {t.status}
                                            </span>
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                {/* ---------- Low Stock Inventory ---------- */}
                <section className="dash-panel">
                    <div className="dash-panel-head">
                        <h3 className="dash-panel-title">Low Stock Inventory</h3>
                        <Link to="/staff/inventory" className="dash-link">
                            View all
                        </Link>
                    </div>

                    <div className="dash-low-list">
                        {lowStock.length === 0 ? (
                            <p className="dash-empty">All products are well stocked.</p>
                        ) : (
                            lowStock.map((p) => {
                                const { level, label } = getStockLevel(p.stock);
                                return (
                                    <div className="dash-low-item" key={p.id}>
                                        {p.image ? (
                                            <img src={p.image} alt={p.name} className="dash-thumb" />
                                        ) : (
                                            <div className="dash-thumb dash-thumb-placeholder" />
                                        )}
                                        <span className="dash-low-name">{p.name}</span>
                                        <span className={`dash-pill dash-pill-${level}`}>{label}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default DashboardOverview;