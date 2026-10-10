import { useState, useEffect, useMemo } from 'react';

import SearchIcon from '../../assets/search-icon.png';
import { getActiveProducts } from '../../api/products';

import '../components-css/inventoryview.css';

const CURRENCY = '$'; // change to your currency symbol

const formatMoney = (value) =>
    `${CURRENCY}${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

function InventoryView() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');

    useEffect(() => {
        const token = localStorage.getItem('token');

        getActiveProducts()
            .then((data) => {
                setProducts(
                    data.map((p) => ({
                        id: p.product_item_id,
                        category: p.category_name,
                        name: p.product_name,
                        price: Number(p.price),
                        stock: p.stock_quantity,
                    }))
                );
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    // Build the category filter list from real data instead of a hardcoded array
    const categories = useMemo(
        () => [...new Set(products.map((p) => p.category))].sort(),
        [products]
    );

    // Cards show the totals of the whole inventory (not affected by search/filter)
    const totalStockItems = products.reduce((sum, p) => sum + p.stock, 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

    const query = search.trim().toLowerCase();

    const filteredProducts = products.filter((p) => {
        const matchesCategory = category === 'All' || p.category === category;
        const matchesSearch =
            !query ||
            p.name.toLowerCase().includes(query) ||
            String(p.id).toLowerCase().includes(query);
        return matchesCategory && matchesSearch;
    });

    if (loading) return <p>Loading inventory...</p>;
    if (error) return <p className="inventory-no-results">Error: {error}</p>;

    return (
        <div className="inventory-page">
            <h2 className="inventory-title">Inventory</h2>

            {/* ---------- Total cards ---------- */}
            <div className="inventory-stats">
                <div className="inventory-stat-card">
                    <h3>Total Stock Items</h3>
                    <p>{totalStockItems.toLocaleString()}</p>
                </div>
                <div className="inventory-stat-card">
                    <h3>Total Inventory Value</h3>
                    <p>{formatMoney(totalInventoryValue)}</p>
                </div>
            </div>

            {/* ---------- List panel ---------- */}
            <div className="inventory-panel">
                <div className="inventory-toolbar">
                    <div className="inventory-search">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name or ID..."
                        />
                        <button type="button" className="inventory-search-btn" aria-label="Search">
                            <img src={SearchIcon} alt="" className="inventory-search-icon" />
                        </button>
                    </div>

                    <select
                        className="inventory-filter"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        aria-label="Filter by category"
                    >
                        <option value="All">Filter by Category</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>

                    <h3 className="inventory-list-title">Full Product Inventory List</h3>
                </div>

                <div className="inventory-table-wrapper">
                    <table className="inventory-table">
                        <thead>
                            <tr>
                                <th>Category_Name</th>
                                <th>Product_Item_Id</th>
                                <th>Product_Name</th>
                                <th>Price</th>
                                <th>Stock_Quantity</th>
                                <th>Total Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((p) => (
                                    <tr key={p.id}>
                                        <td>{p.category}</td>
                                        <td>{p.id}</td>
                                        <td>{p.name}</td>
                                        <td>{formatMoney(p.price)}</td>
                                        <td>{p.stock}</td>
                                        <td>{formatMoney(p.price * p.stock)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="inventory-no-results">
                                        No products found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default InventoryView;