import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { getTodayTransactions } from '../../api/transaction';
import { getAllProducts } from '../../api/products';
import { formatMoney } from './recordsHelpers';
import '../components-css/dashboardoverview.css';

const LOW_STOCK_LIMIT = 20;

const getStockLevel = (stock) => {
    if (stock === 0) return { level: 'red', label: 'Out of stock' };
    if (stock <= 5) return { level: 'red', label: `${stock} left` };
    if (stock <= 10) return { level: 'yellow', label: `${stock} left` };
    return { level: 'green', label: `${stock} left` };
};

const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

function DashboardOverview() {
    const [transactions, setTransactions] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');

        Promise.all([getTodayTransactions(token), getAllProducts(token)])
            .then(([txnData, productsData]) => {
                setTransactions(txnData);
                setInventory(
                    productsData.map((p) => ({
                        id: p.product_item_id,
                        name: p.product_name,
                        price: Number(p.price),
                        stock: p.stock_quantity,
                        image: p.image,
                    }))
                );
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const transactionCount = transactions.length; // already one-per-employee-per-day at the DB level

    const totalInventoryValue = inventory.reduce((sum, p) => sum + p.price * p.stock, 0);

    const lowStock = inventory
        .filter((p) => p.stock <= LOW_STOCK_LIMIT)
        .sort((a, b) => a.stock - b.stock);

    if (loading) return <p className="dash-empty">Loading dashboard...</p>;
    if (error) return <p className="dash-empty">Error: {error}</p>;

    return (
        <div className="dash-page">
            <h2 className="dash-title">Dashboard</h2>

            <div className="dash-layout">
                <section className="dash-panel">
                    <h3 className="dash-panel-title">Today's Transaction</h3>

                    <div className="dash-summary">
                        <div className="dash-stat">
                            <span className="dash-stat-label">Transaction</span>
                            <span className="dash-stat-value">{transactionCount}</span>
                        </div>

                        <div className="dash-summary-divider" />

                        <div className="dash-stat">
                            <span className="dash-stat-label">Total Inventory Value</span>
                            <span className="dash-stat-value">{formatMoney(totalInventoryValue)}</span>
                        </div>
                    </div>

                    <div className="dash-table-box">
                        <div className="dash-row dash-cols dash-head">
                            <span>Time</span>
                            <span>Employee</span>
                            <span>Items</span>
                            <span>Total</span>
                        </div>

                        <div className="dash-list">
                            {transactions.length === 0 ? (
                                <p className="dash-empty">No transactions today.</p>
                            ) : (
                                transactions.map((t) => (
                                    <div className="dash-row dash-cols dash-item" key={t.id}>
                                        <span>{formatTime(t.time)}</span>
                                        <span className="dash-ellipsis">{t.employee}</span>
                                        <span>{t.items}</span>
                                        <span>{formatMoney(t.total)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>

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