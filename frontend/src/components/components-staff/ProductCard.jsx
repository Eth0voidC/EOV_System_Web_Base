import '../components-css/productcard.css';

const CURRENCY = '$'; // change to your currency symbol

function ProductCard({ name, quantity, price, image, onClick }) {
    return (
        <div className="product-card" onClick={onClick}>
            <div className="product-image-wrapper">
                {image ? (
                    <img src={image} alt={name} className="product-image" />
                ) : (
                    <div className="product-image-placeholder" />
                )}
            </div>

            <div className="product-info">
                <p>Name: {name}</p>
                <p>Quantity: {quantity}</p>
                <p>Price: {CURRENCY}{Number(price).toFixed(2)}</p>
            </div>
        </div>
    );
}

export default ProductCard;