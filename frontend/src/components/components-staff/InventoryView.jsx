import { useState } from 'react';

import SearchIcon from '../../assets/search-icon.png';

import '../components-css/inventoryview.css';

const CURRENCY = '$'; // change to your currency symbol

// Temporary sample data. Later this comes from the API.
const categories = ['Beverages', 'Snacks', 'Canned Goods', 'Household', 'Personal Care'];

const sampleProducts = Array.from({ length: 20 }, (_, i) => ({
    id: `ITM-${String(i + 1).padStart(3, '0')}`,
    category: categories[i % categories.length],
    name: `Product ${i + 1}`,
    price: 50 + i * 12.5,
    stock: (i + 1) * 5,
}));

const formatMoney = (value) =>
    `${CURRENCY}${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

function InventoryView() {
    const [products] = useState(sampleProducts);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');

    // Cards show the totals of the whole inventory (not affected by search/filter)
    const totalStockItems = products.reduce((sum, p) => sum + p.stock, 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

    const query = search.trim().toLowerCase();

    const filteredProducts = products.filter((p) => {
        const matchesCategory = category === 'All' || p.category === category;
        const matchesSearch =
            !query ||
            p.name.toLowerCase().includes(query) ||
            p.id.toLowerCase().includes(query);
        return matchesCategory && matchesSearch;
    });

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