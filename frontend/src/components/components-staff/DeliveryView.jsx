import { useState, useEffect } from 'react';

import SearchIcon from '../../assets/search-icon.png';

import '../components-css/deliveryview.css';

// Temporary sample data. Later this comes from the API.
const initialProducts = Array.from({ length: 14 }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    stock: (i + 1) * 5,
}));

function DeliveryView() {
    const [products, setProducts] = useState(initialProducts);

    // Receive form
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [formError, setFormError] = useState('');

    // Receive list
    const [receiveList, setReceiveList] = useState([]);
    const [message, setMessage] = useState('');

    // Automatic date and time (not editable)
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Product suggestions while typing (hidden once a product is chosen)
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
        setSelected(null); // typing again means the old choice no longer applies
        setFormError('');
    };

    const handleSelect = (product) => {
        setSelected(product);
        setQuery(product.name);
        setFormError('');
    };

    // Numbers only
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

    // const handleAddToList = () => {
    //     if (!selected) {
    //         setFormError('Please choose a product from the suggestions.');
    //         return;
    //     }

    //     const qty = parseInt(quantity, 10);
    //     if (!qty || qty <= 0) {
    //         setFormError('Quantity must be greater than 0.');
    //         return;
    //     }

    //     setReceiveList((prev) => {
    //         const existing = prev.find((item) => item.id === selected.id);

    //         // Same product twice: add the quantities together
    //         if (existing) {
    //             return prev.map((item) =>
    //                 item.id === selected.id ? { ...item, received: item.received + qty } : item
    //             );
    //         }

    //         return [
    //             ...prev,
    //             {
    //                 id: selected.id,
    //                 name: selected.name,
    //                 currentStock: selected.stock,
    //                 received: qty,
    //             },
    //         ];
    //     });

    //     setMessage('');
    //     clearForm();
    // };

    const handleAddToList = () => {
    const name = query.trim();

    // TESTING ONLY: allow typing a name that isn't in the product list
    let product = selected;
    if (!product) {
        if (!name) {
            setFormError('Please type or choose a product name.');
            return;
        }
        // If the typed name matches an existing product, use that one
        product =
            products.find((p) => p.name.toLowerCase() === name.toLowerCase()) || {
                id: `test-${Date.now()}`,
                name,
                stock: 0,
                isNew: true,
            };
    }

    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
        setFormError('Quantity must be greater than 0.');
        return;
    }

    setReceiveList((prev) => {
        // Same product (by id or by name): add the quantities together
        const existing = prev.find(
            (item) =>
                item.id === product.id ||
                item.name.toLowerCase() === product.name.toLowerCase()
        );

        if (existing) {
            return prev.map((item) =>
                item === existing ? { ...item, received: item.received + qty } : item
            );
        }

        return [
            ...prev,
            {
                id: product.id,
                name: product.name,
                currentStock: product.stock,
                received: qty,
                isNew: product.isNew || false,
            },
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

    // const handleSubmit = () => {
    //     // Later: send this to the API (save the delivery and increase the stock)
    //     const delivery = {
    //         receivedBy: localStorage.getItem('username'),
    //         receivedAt: now.toISOString(),
    //         items: receiveList.map(({ id, name, received }) => ({ id, name, received })),
    //     };
    //     console.log('Submitting delivery:', delivery);

    //     // For now, update the sample stock so you can see the result
    //     setProducts((prev) =>
    //         prev.map((product) => {
    //             const item = receiveList.find((i) => i.id === product.id);
    //             return item ? { ...product, stock: product.stock + item.received } : product;
    //         })
    //     );

    //     setReceiveList([]);
    //     setMessage('Delivery submitted!');
    // };

    const handleSubmit = () => {
    // Later: send this to the API (save the delivery and increase the stock)
    const delivery = {
        receivedBy: localStorage.getItem('username'),
        receivedAt: now.toISOString(),
        items: receiveList.map(({ id, name, received }) => ({ id, name, received })),
    };
    console.log('Submitting delivery:', delivery);

    // For now, update the sample stock so you can see the result
    setProducts((prev) => {
        const updated = prev.map((product) => {
            const item = receiveList.find((i) => i.id === product.id);
            return item ? { ...product, stock: product.stock + item.received } : product;
        });

        // TESTING ONLY: products that didn't exist before are added to the list
        const newProducts = receiveList
            .filter((i) => i.isNew)
            .map((i) => ({ id: i.id, name: i.name, stock: i.received }));

        return [...updated, ...newProducts];
    });

        setReceiveList([]);
        setMessage('Delivery submitted!');
    };

    return (
        <div className="delivery-page">
            <h2 className="delivery-title">Delivery</h2>

            <div className="delivery-panels">
                {/* ---------- Left: Receive Form ---------- */}
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

                {/* ---------- Right: Receive Product List ---------- */}
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

                        {message && <p className="delivery-success">{message}</p>}

                        <div className="receive-summary">
                            <div className="receive-datetime">
                                <p>
                                    <strong>Received Date:</strong> {now.toLocaleDateString()}
                                </p>
                                <p>
                                    <strong>Received Time:</strong> {now.toLocaleTimeString()}
                                </p>
                            </div>
                            <p className="receive-total">
                                <strong>Total Received Items:</strong> {totalReceived}
                            </p>
                            <p className="receive-total">
                                <strong>Total Units Received:</strong> {totalUnits}
                            </p>
                        </div>

                        <div className="delivery-footer">
                            <button
                                type="button"
                                className="delivery-clear-btn"
                                onClick={handleClearList}
                                disabled={receiveList.length === 0}
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                className="delivery-main-btn"
                                onClick={handleSubmit}
                                disabled={receiveList.length === 0}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default DeliveryView;