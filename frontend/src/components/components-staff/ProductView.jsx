import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import ShoppingCart from './ShoppingCart';

import SearchIcon from '../../assets/search-icon.png';
import CartIcon from '../../assets/shopping-cart-icon.png';

import { getAllProducts } from '../../api/products';
import { getAllEmployees } from '../../api/employees';
import { createTransaction } from '../../api/transaction';

import '../components-css/productcard.css';
import '../components-css/shoppingcart.css';

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

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const loadProducts = () => {
        const token = localStorage.getItem('token');
        return getAllProducts(token).then((data) => {
            setProducts(
                data.map((p) => ({
                    id: p.product_item_id,
                    name: p.product_name,
                    quantity: p.stock_quantity,
                    price: Number(p.price),
                    image: p.image,
                }))
            );
        });
    };

    useEffect(() => {
        const token = localStorage.getItem('token');

        Promise.all([getAllProducts(token), getAllEmployees(token)])
            .then(([productsData, employeesData]) => {
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
        setSubmitError('');
    };

    const handleSubmit = async () => {
        if (!selectedEmployee || selectedEmployee.status !== 'Active' || cartItems.length === 0) {
            return;
        }

        setSubmitting(true);
        setSubmitError('');

        try {
            const token = localStorage.getItem('token');
            const items = cartItems.map((item) => ({
                product_item_id: item.id,
                quantity: item.quantity,
            }));

            await createTransaction(token, selectedEmployee.id, items);

            await loadProducts(); // refresh stock numbers from the database

            setCartItems([]);
            resetEmployee();
            setIsCartOpen(false);
        } catch (err) {
            setSubmitError(err.message);
        } finally {
            setSubmitting(false);
        }
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
                    submitting={submitting}
                    submitError={submitError}
                />
            )}
        </div>
    );
}

export default ProductView;