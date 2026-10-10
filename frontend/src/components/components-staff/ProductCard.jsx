import '../components-css/productcard.css';

const CURRENCY = '₱'; // change to your currency symbol

function ProductCard({ name, quantity, price, image, onClick }) {
    const outOfStock = quantity <= 0;

    return (
        <div
            className={`product-card${outOfStock ? ' product-card-disabled' : ''}`}
            onClick={outOfStock ? undefined : onClick}
        >
            <div className="product-image-wrapper">
                {image ? (
                    <img src={image} alt={name} className="product-image" />
                ) : (
                    <div className="product-image-placeholder" />
                )}

                {outOfStock && (
                    <div className="out-of-stock-overlay">
                        <span>OUT OF STOCK</span>
                    </div>
                )}
            </div>

            <div className="product-info">
                <p>Name: {name}</p>
                <p>Quantity: {quantity}</p>
                <p>Price: {CURRENCY}{Number(price).toFixed(0)}</p>
            </div>
        </div>
    );
}

export default ProductCard;