import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import ShoppingCart from './ShoppingCart';

import SearchIcon from '../../assets/search-icon.png';
import CartIcon from '../../assets/shopping-cart-icon.png';

import { getAllProducts } from '../../api/products';
import { getAllEmployees } from '../../api/employees';

import '../components-css/productcard.css';
import '../components-css/shoppingcart.css';

// Temporary sample data.
// const sampleProducts = Array.from({ length: 14 }, (_, i) => ({
//     id: i + 1,
//     name: `Product ${i + 1}`,
//     quantity: (i + 1) * 5,
//     price: 50 + i * 12.5,
//     image: '',
// }));

// Temporary sample employees. 
// const sampleEmployees = [
//     { id: 1, name: 'Maria Reyes', status: 'Active' },
//     { id: 2, name: 'Mark Santos', status: 'Active' },
//     { id: 3, name: 'Maricel Cruz', status: 'Restricted' },
//     { id: 4, name: 'John Dela Cruz', status: 'Active' },
//     { id: 5, name: 'Jane Garcia', status: 'Restricted' },
//     { id: 6, name: 'Paolo Mendoza', status: 'Active' },
//     { id: 7, name: 'Jay Labastida', status: 'Restricted' },
//     { id: 8, name: 'John Eukie Revilla', status: 'Restricted' },
// ];

function ProductView() {
    const [products, setProducts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [search, setSearch] = useState('');
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const [employeeQuery, setEmployeeQuery] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');

        Promise.all([getAllProducts(token), getAllEmployees(token)])
            .then(([productsData, employeesData]) => {
                // Map backend shape -> what ProductCard/ShoppingCart expect
                setProducts(
                    productsData.map((p) => ({
                        id: p.product_item_id,
                        name: p.product_name,
                        quantity: p.stock_quantity,
                        price: Number(p.price),
                        image: p.image,
                    }))
                );

                setEmployees(
                    employeesData.map((e) => ({
                        id: e.employee_id,
                        name: `${e.last_name}, ${e.first_name}`,
                        status: e.account_status, // 'Active' | 'Restricted'
                        employmentStatus: e.employment_status, // 'Regular' | 'Extra' | 'Inactive'
                    })).filter((e) => e.employmentStatus !== 'Inactive') // hide Inactive from search entirely
                );
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(search.trim().toLowerCase())
    );

    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const handleAddToCart = (product) => {
        if (product.quantity <= 0) return;

        setCartItems((prev) => {
            const existing = prev.find((item) => item.id === product.id);

            if (existing) {
                if (existing.quantity >= product.quantity) return prev;
                return prev.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }

            return [
                ...prev,
                { id: product.id, name: product.name, price: product.price, stock: product.quantity, quantity: 1 },
            ];
        });
    };

    const handleIncrease = (id) => {
        setCartItems((prev) =>
            prev.map((item) =>
                item.id === id && item.quantity < item.stock ? { ...item, quantity: item.quantity + 1 } : item
            )
        );
    };

    const handleDecrease = (id) => {
        setCartItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item)).filter((item) => item.quantity > 0)
        );
    };

    const handleRemove = (id) => {
        setCartItems((prev) => prev.filter((item) => item.id !== id));
    };

    const handleEmployeeQueryChange = (value) => {
        setEmployeeQuery(value);
        setSelectedEmployee(null);
    };

    const handleEmployeeSelect = (employee) => {
        setSelectedEmployee(employee);
        setEmployeeQuery(employee.name);
    };

    const resetEmployee = () => {
        setEmployeeQuery('');
        setSelectedEmployee(null);
    };

    const handleClear = () => {
        setCartItems([]);
        resetEmployee();
    };

    const handleSubmit = () => {
        if (!selectedEmployee || selectedEmployee.status !== 'Active' || cartItems.length === 0) {
            return;
        }

        // NOT connected yet — employee_transaction/transaction_detail tables
        // don't exist in the database yet. This still just logs for now.
        console.log('Submitting order:', { employee: selectedEmployee, items: cartItems });

        setCartItems([]);
        resetEmployee();
        setIsCartOpen(false);
    };

    if (loading) return <p>Loading products...</p>;
    if (error) return <p className="no-results">Error: {error}</p>;

    return (
        <div className="product-page">
            <div className="product-topbar">
                <h2 className="product-title">Product</h2>

                <div className="search-area">
                    <div className="search-bar">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search product..."
                        />

                        <button type="button" className="search-btn" aria-label="Search">
                            <img src={SearchIcon} alt="" className="search-icon" />
                        </button>
                    </div>

                    <button
                        type="button"
                        className="cart-btn"
                        onClick={() => setIsCartOpen(true)}
                        aria-label="Open shopping cart"
                    >
                        <img src={CartIcon} alt="" className="cart-icon" />
                        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                    </button>
                </div>

                {/* Empty transparent area (buttons can go here later) */}
                <div className="product-topbar-right"></div>
            </div>

            <div className="product-panel">
                {filteredProducts.length > 0 ? (
                    <div className="product-grid">
                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                name={product.name}
                                quantity={product.quantity}
                                price={product.price}
                                image={product.image}
                                onClick={() => handleAddToCart(product)}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="no-results">No products found.</p>
                )}
            </div>

            {isCartOpen && (
                <ShoppingCart
                    items={cartItems}
                    employees={employees}
                    employeeQuery={employeeQuery}
                    selectedEmployee={selectedEmployee}
                    onEmployeeQueryChange={handleEmployeeQueryChange}
                    onEmployeeSelect={handleEmployeeSelect}
                    onClose={() => setIsCartOpen(false)}
                    onIncrease={handleIncrease}
                    onDecrease={handleDecrease}
                    onRemove={handleRemove}
                    onClear={handleClear}
                    onSubmit={handleSubmit}
                />
            )}
        </div>
    );
}

export default ProductView;