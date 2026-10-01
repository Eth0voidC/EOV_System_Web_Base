import { useState } from 'react';
import ProductCard from './ProductCard';
import ShoppingCart from './ShoppingCart';

import SearchIcon from '../../assets/search-icon.png';
import CartIcon from '../../assets/shopping-cart-icon.png';

import '../components-css/productcard.css';
import '../components-css/shoppingcart.css';

// Temporary sample data. Later this comes from the API.
const sampleProducts = Array.from({ length: 14 }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    quantity: (i + 1) * 5,
    price: 50 + i * 12.5,
    image: '',
}));

function ProductView() {
    const [search, setSearch] = useState('');
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const filteredProducts = sampleProducts.filter((product) =>
        product.name.toLowerCase().includes(search.trim().toLowerCase())
    );

    // Number of units in the cart (shown on the badge)
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Clicking a card adds it (or adds 1 more if already in the cart)
    const handleAddToCart = (product) => {
        if (product.quantity <= 0) return; // out of stock

        setCartItems((prev) => {
            const existing = prev.find((item) => item.id === product.id);

            if (existing) {
                // Don't go above the available stock
                if (existing.quantity >= product.quantity) return prev;
                return prev.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }

            return [
                ...prev,
                {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    stock: product.quantity,
                    quantity: 1,
                },
            ];
        });
    };

    const handleIncrease = (id) => {
        setCartItems((prev) =>
            prev.map((item) =>
                item.id === id && item.quantity < item.stock
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            )
        );
    };

    // Going down to 0 removes the item
    const handleDecrease = (id) => {
        setCartItems((prev) =>
            prev
                .map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
                .filter((item) => item.quantity > 0)
        );
    };

    const handleRemove = (id) => {
        setCartItems((prev) => prev.filter((item) => item.id !== id));
    };

    const handleClear = () => setCartItems([]);

    const handleSubmit = () => {
        // Later: send cartItems to the API here (create the order, reduce stock)
        console.log('Submitting order:', cartItems);
        setCartItems([]);
        setIsCartOpen(false);
    };

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