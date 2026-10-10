import { useState, useEffect } from 'react';

import SearchIcon from '../../assets/search-icon.png';
import { getActiveProducts } from '../../api/products';
import { createDelivery } from '../../api/delivery';

import '../components-css/deliveryview.css';

function DeliveryView() {
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadError, setLoadError] = useState('');

    // Receive form
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [formError, setFormError] = useState('');

    // Receive list
    const [receiveList, setReceiveList] = useState([]);
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Automatic date and time (display only — the actual saved date/time
    // comes from the database, set at the moment of submit)
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchProducts = () => {
        const token = localStorage.getItem('token');
        setLoadingProducts(true);

        getActiveProducts()
            .then((data) => {
                setProducts(
                    data.map((p) => ({
                        id: p.product_item_id,
                        name: p.product_name,
                        stock: p.stock_quantity,
                    }))
                );
            })
            .catch((err) => setLoadError(err.message))
            .finally(() => setLoadingProducts(false));
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const suggestions =
        query.trim() && !selected
            ? products
                  .filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
                  .slice(0, 6)
            : [];

    const totalReceived = receiveList.length;
    const totalUnits = receiveList.reduce((sum, item) => sum + item.received, 0);

    const handleQueryChange = (e) => {
        setQuery(e.target.value);
        setSelected(null);
        setFormError('');
    };

    const handleSelect = (product) => {
        setSelected(product);
        setQuery(product.name);
        setFormError('');
    };

    const handleQuantityChange = (e) => {
        setQuantity(e.target.value.replace(/\D/g, ''));
        setFormError('');
    };

    const clearForm = () => {
        setQuery('');
        setSelected(null);
        setQuantity('');
        setFormError('');
    };

    const handleAddToList = () => {
        if (!selected) {
            setFormError('Please choose a product from the suggestions.');
            return;
        }

        const qty = parseInt(quantity, 10);
        if (!qty || qty <= 0) {
            setFormError('Quantity must be greater than 0.');
            return;
        }

        setReceiveList((prev) => {
            const existing = prev.find((item) => item.id === selected.id);

            if (existing) {
                return prev.map((item) =>
                    item.id === selected.id ? { ...item, received: item.received + qty } : item
                );
            }

            return [
                ...prev,
                { id: selected.id, name: selected.name, currentStock: selected.stock, received: qty },
            ];
        });

        setMessage('');
        clearForm();
    };

    const handleRemove = (id) => {
        setReceiveList((prev) => prev.filter((item) => item.id !== id));
    };

    const handleClearList = () => {
        setReceiveList([]);
        setMessage('');
    };

    const handleSubmit = async () => {
        if (receiveList.length === 0) return;

        setSubmitting(true);
        setMessage('');

        try {
            const token = localStorage.getItem('token');
            const items = receiveList.map((item) => ({
                product_item_id: item.id,
                quantity_received: item.received,
            }));

            await createDelivery(token, items);

            setReceiveList([]);
            setMessage('Delivery submitted!');
            fetchProducts(); // refresh stock numbers from the database
        } catch (err) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingProducts) return <p>Loading products...</p>;
    if (loadError) return <p className="delivery-error">Error: {loadError}</p>;

    return (
        <div className="delivery-page">
            <h2 className="delivery-title">Delivery</h2>

            <div className="delivery-panels">
                <section className="delivery-panel">
                    <h3 className="delivery-panel-header">Receive Form</h3>

                    <div className="delivery-panel-body">
                        <div className="delivery-form">
                            <label className="delivery-label">Search Product Items Name</label>
                            <div className="delivery-search">
                                <img src={SearchIcon} alt="" className="delivery-search-icon" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={handleQueryChange}
                                    placeholder="Search product..."
                                />

                                {suggestions.length > 0 && (
                                    <ul className="delivery-suggestions">
                                        {suggestions.map((product) => (
                                            <li key={product.id} onClick={() => handleSelect(product)}>
                                                <span>{product.name}</span>
                                                <span className="suggestion-stock">Stock: {product.stock}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <label className="delivery-label">Quantity Received</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                className="delivery-input"
                                value={quantity}
                                onChange={handleQuantityChange}
                                placeholder="Enter Number only...."
                            />

                            {formError && <p className="delivery-error">{formError}</p>}
                        </div>

                        <div className="delivery-footer">
                            <button type="button" className="delivery-clear-btn" onClick={clearForm}>
                                Clear
                            </button>
                            <button type="button" className="delivery-main-btn" onClick={handleAddToList}>
                                Add to List
                            </button>
                        </div>
                    </div>
                </section>

                <section className="delivery-panel">
                    <h3 className="delivery-panel-header">Receive Product List</h3>

                    <div className="delivery-panel-body">
                        <div className="receive-row receive-header-row">
                            <span>Product Name</span>
                            <span>Current Stock</span>
                            <span>Received Stock</span>
                            <span>Total Stock</span>
                            <span></span>
                        </div>

                        <div className="receive-list">
                            {receiveList.length === 0 ? (
                                <p className="receive-empty">No items added yet.</p>
                            ) : (
                                receiveList.map((item) => (
                                    <div className="receive-row receive-item" key={item.id}>
                                        <span className="receive-name">{item.name}</span>
                                        <span>{item.currentStock}</span>
                                        <span>{item.received}</span>
                                        <span>{item.currentStock + item.received}</span>
                                        <button
                                            type="button"
                                            className="receive-remove-btn"
                                            onClick={() => handleRemove(item.id)}
                                            aria-label={`Remove ${item.name}`}
                                        >
                                            x
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {message && (
                            <p className={message.startsWith('Error') ? 'delivery-error' : 'delivery-success'}>
                                {message}
                            </p>
                        )}

                        <div className="receive-summary">
                            <div className="receive-datetime">
                                <p><strong>Received Date:</strong> {now.toLocaleDateString()}</p>
                                <p><strong>Received Time:</strong> {now.toLocaleTimeString()}</p>
                            </div>
                            <p className="receive-total"><strong>Total Received Items:</strong> {totalReceived}</p>
                            <p className="receive-total"><strong>Total Units Received:</strong> {totalUnits}</p>
                        </div>

                        <div className="delivery-footer">
                            <button
                                type="button"
                                className="delivery-clear-btn"
                                onClick={handleClearList}
                                disabled={receiveList.length === 0 || submitting}
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                className="delivery-main-btn"
                                onClick={handleSubmit}
                                disabled={receiveList.length === 0 || submitting}
                            >
                                {submitting ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default DeliveryView;