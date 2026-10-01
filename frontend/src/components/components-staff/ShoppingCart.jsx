import '../components-css/shoppingcart.css';

const CURRENCY = '$'; // change to your currency symbol

function ShoppingCart({ items, onClose, onIncrease, onDecrease, onRemove, onClear, onSubmit }) {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const isEmpty = items.length === 0;

    return (
        // Clicking the dark background closes the popup
        <div className="cart-overlay" onClick={onClose}>
            {/* stopPropagation so clicking inside the popup doesn't close it */}
            <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="cart-title">Shopping Cart</h2>

                <div className="cart-row cart-header-row">
                    <span>Products Name</span>
                    <span>Quantity</span>
                    <span>Price</span>
                    <span></span>
                </div>

                <div className="cart-list">
                    {isEmpty ? (
                        <p className="cart-empty">Your cart is empty.</p>
                    ) : (
                        items.map((item) => (
                            <div className="cart-row cart-item" key={item.id}>
                                <span className="cart-item-name">{item.name}</span>
                                <span>{item.quantity}</span>
                                <span>{CURRENCY}{(item.price * item.quantity).toFixed(2)}</span>
                                <span className="cart-actions">
                                    <button
                                        type="button"
                                        onClick={() => onIncrease(item.id)}
                                        disabled={item.quantity >= item.stock}
                                        aria-label="Increase quantity"
                                    >
                                        +
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onDecrease(item.id)}
                                        aria-label="Decrease quantity"
                                    >
                                        -
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onRemove(item.id)}
                                        aria-label="Remove item"
                                    >
                                        x
                                    </button>
                                </span>
                            </div>
                        ))
                    )}
                </div>

                <div className="cart-total">
                    <span>Total Price</span>
                    <span className="cart-total-value">{CURRENCY}{total.toFixed(2)}</span>
                </div>

                <div className="cart-footer">
                    <button type="button" className="cart-clear-btn" onClick={onClear} disabled={isEmpty}>
                        Clear
                    </button>
                    <button type="button" className="cart-submit-btn" onClick={onSubmit} disabled={isEmpty}>
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ShoppingCart;