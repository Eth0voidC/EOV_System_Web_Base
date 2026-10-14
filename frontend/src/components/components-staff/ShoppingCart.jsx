import '../components-css/shoppingcart.css';

const CURRENCY = '₱'; // change to your currency symbol

function ShoppingCart({
    items,
    employees,
    employeeQuery,
    selectedEmployee,
    onEmployeeQueryChange,
    onEmployeeSelect,
    onClose,
    onIncrease,
    onDecrease,
    onRemove,
    onClear,
    onSubmit,
    submitting = false,
    submitError = '',
}) {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const isEmpty = items.length === 0;

    const isRestricted = selectedEmployee?.status === 'Restricted';
    const canSubmit = !isEmpty && selectedEmployee && !isRestricted && !submitting;

    // Suggestions while typing (hidden once an employee is chosen)
    const suggestions =
    employeeQuery.trim() && !selectedEmployee
        ? employees
            .filter((emp) => {
                const isActiveEmployment =
                    emp.employmentStatus?.trim().toLowerCase() !== 'inactive';

                const isValidAccount =
                    ['active', 'restricted'].includes(
                        emp.status?.trim().toLowerCase()
                    );

                const matchesName =
                    emp.name.toLowerCase().includes(
                        employeeQuery.trim().toLowerCase()
                    );

                return isActiveEmployment && isValidAccount && matchesName;
            })
            .slice(0, 15)
        : [];

    // Tells the staff why Submit is disabled
    let hint = '';
    if (isRestricted) {
        hint = 'This employee is restricted and cannot make purchases.';
    } else if (!isEmpty && !selectedEmployee) {
        hint = 'Choose an employee from the suggestions to submit.';
    }

    return (
        // Clicking the dark background closes the popup
        <div className="cart-overlay" onClick={onClose}>
            {/* stopPropagation so clicking inside the popup doesn't close it */}
            <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="cart-title">Shopping Cart</h2>

                {/* ---------- Employee ---------- */}
                <div className="cart-employee">
                    <label className="cart-employee-label">Employee's Name :</label>

                    <div className="cart-employee-field">
                        <input
                            type="text"
                            value={employeeQuery}
                            onChange={(e) => onEmployeeQueryChange(e.target.value)}
                            placeholder="Type a name..."
                            disabled={submitting}
                        />

                        {suggestions.length > 0 && (
                            <ul className="employee-suggestions">
                                {suggestions.map((emp) => (
                                    <li key={emp.id} onClick={() => onEmployeeSelect(emp)}>
                                        <span>{emp.name}</span>
                                        <span className={`status-badge status-${emp.status.toLowerCase()}`}>
                                            {emp.status}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {employeeQuery.trim() && !selectedEmployee && suggestions.length === 0 && (
                            <ul className="employee-suggestions">
                                <li className="employee-no-match">No employee found.</li>
                            </ul>
                        )}
                    </div>

                    {selectedEmployee && (
                        <span className={`status-badge status-${selectedEmployee.status.toLowerCase()}`}>
                            {selectedEmployee.status}
                        </span>
                    )}
                </div>

                {hint && <p className="cart-hint">{hint}</p>}
                {submitError && <p className="cart-error">{submitError}</p>}

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
                                        disabled={item.quantity >= item.stock || submitting}
                                        aria-label="Increase quantity"
                                    >
                                        +
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onDecrease(item.id)}
                                        disabled={submitting}
                                        aria-label="Decrease quantity"
                                    >
                                        -
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onRemove(item.id)}
                                        disabled={submitting}
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
                    <button
                        type="button"
                        className="cart-clear-btn"
                        onClick={onClear}
                        disabled={(isEmpty && !selectedEmployee && !employeeQuery) || submitting}
                    >
                        Clear
                    </button>
                    <button type="button" className="cart-submit-btn" onClick={onSubmit} disabled={!canSubmit}>
                        {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ShoppingCart;