import { useState, useRef, useMemo, useEffect } from 'react';

// CORRECTED IMPORT: "products" (plural) to match frontend/src/api/products.js
import { getAllProducts, createProduct, updateProduct, updateProductStatus } from '../../api/products';
import { getAllCategories, createCategory } from '../../api/categories';

import EditIcon from '../../assets/pencil-icon.png';
import SaveIcon from '../../assets/save-icon.png';
import DropdownIcon from '../../assets/dropdown-icon.png';
import GreenCircleIcon from '../../assets/greencircle-icon.png';
import GreyCircleIcon from '../../assets/greycircle-icon.png';
import UploadPhotoIcon from '../../assets/uploadphoto-icon.png';

import '../components-css/inventoryviewadmin.css';
import '../components-css/addproductcategory.css'; 
import '../components-css/inventoryoverview.css';

const ALLOWED_TEXT = /^[\p{L}\p{N}\s.,'&()\-/]+$/u;
const HAS_LETTER_OR_NUMBER = /[\p{L}\p{N}]/u;
const isValidText = (text) => ALLOWED_TEXT.test(text) && HAS_LETTER_OR_NUMBER.test(text);

const LOW_STOCK_LIMIT = 20;

function InventoryViewAdmin() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [categoryError, setCategoryError] = useState('');
    const [productErrors, setProductErrors] = useState({});

    // ---------- Add Category form ----------
    const [newCategoryName, setNewCategoryName] = useState('');

    // ---------- Add Product form ----------
    const [newProduct, setNewProduct] = useState({ categoryId: '', name: '', qty: '', price: '' });
    const [newProductImage, setNewProductImage] = useState(null); 
    const [newProductImageFile, setNewProductImageFile] = useState(null);
    const fileInputRef = useRef(null);

    // ---------- List controls ----------
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All'); 
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [openRowStatusId, setOpenRowStatusId] = useState(null);

    // ---------- Row editing ----------
    const [editingRowId, setEditingRowId] = useState(null);
    const [editDraft, setEditDraft] = useState({ name: '', price: '', stock: '' });

    // =====================================================================
    // Fetch Initial Data
    // =====================================================================
    const fetchData = async () => {
        try {
            const [fetchedCategories, fetchedProducts] = await Promise.all([
                getAllCategories(),
                getAllProducts()
            ]);
            setCategories(fetchedCategories);
            setProducts(fetchedProducts);
        } catch (error) {
            console.error("Failed to load inventory data:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // =====================================================================
    // Overview stats
    // =====================================================================
    const stats = useMemo(() => {
        // Assume default status is 'Active' if missing from backend for older records
        const activeProducts = products.filter(
            (p) => (p.status || 'Active') === 'Active'
        );

        const totalProducts = activeProducts.length;

        const totalStock = activeProducts.reduce(
            (sum, p) => sum + Number(p.stock_quantity),
            0
        );

        const inventoryValue = activeProducts.reduce(
            (sum, p) => sum + Number(p.price) * Number(p.stock_quantity),
            0
        );

        const lowStock = activeProducts.filter(
            (p) => Number(p.stock_quantity) > 0 &&
                Number(p.stock_quantity) <= LOW_STOCK_LIMIT
        ).length;

        const outOfStock = activeProducts.filter(
            (p) => Number(p.stock_quantity) === 0
        ).length;

        const active = products.filter(
            (p) => (p.status || 'Active') === 'Active'
        ).length;

        const inactive = products.filter(
            (p) => p.status === 'Inactive'
        ).length;

        return {
            totalProducts,
            totalStock,
            inventoryValue,
            lowStock,
            outOfStock,
            active,
            inactive
        };
    }, [products]);

    // =====================================================================
    // Add Category
    // =====================================================================
    const validateCategoryName = (name) => {
        const trimmed = name.trim();
        if (!trimmed) return '* Please enter a category name.';
        if (trimmed.length < 2) return '* Category name must be at least 2 characters.';
        if (trimmed.length > 30) return '* Category name must be 30 characters or less.';
        if (!isValidText(trimmed)) return '* Please enter a valid name (no emojis or special symbols).';
        if (categories.some((c) => c.category_name.toLowerCase() === trimmed.toLowerCase())) return '* This category already exists.';
        return '';
    };

    const handleCategoryNameChange = (value) => {
        setNewCategoryName(value);
        if (categoryError) setCategoryError('');
    };

    const handleAddCategory = async () => {
        const error = validateCategoryName(newCategoryName);
        setCategoryError(error);

        if (error) {
            setNewCategoryName('');
            return;
        }

        try {
            await createCategory(newCategoryName.trim());
            setNewCategoryName('');
            fetchData(); // Refresh list to get the new category with its ID
        } catch (err) {
            setCategoryError(err.message || '* Failed to create category');
        }
    };

    const handleClearCategory = () => {
        setNewCategoryName('');
        setCategoryError('');
    };

    // =====================================================================
    // Add Product
    // =====================================================================
    const validateProduct = ({ categoryId, name, qty, price }) => {
        const errors = {};

        if (!categoryId) errors.categoryId = '* Please select a category.';

        const trimmedName = name.trim();
        if (!trimmedName) {
            errors.name = '* Please enter a product name.';
        } else if (trimmedName.length > 60) {
            errors.name = '* Product name must be 60 characters or less.';
        } else if (!isValidText(trimmedName)) {
            errors.name = '* Please enter a valid name (no emojis or special symbols).';
        } else if (products.some((p) => String(p.product_category_id) === String(categoryId) && p.product_name.toLowerCase() === trimmedName.toLowerCase())) {
            errors.name = '* This product already exists in this category.';
        }

        if (qty === '') {
            errors.qty = '* Please enter a quantity.';
        } else if (!Number.isInteger(Number(qty)) || Number(qty) < 0) {
            errors.qty = '* Quantity must be a whole number (0 or more).';
        }

        if (price === '') {
            errors.price = '* Please enter a price.';
        } else if (!(Number(price) > 0)) {
            errors.price = '* Price must be greater than 0.';
        }

        return errors;
    };

    const handleProductFieldChange = (field, value) => {
        setNewProduct((prev) => ({ ...prev, [field]: value }));
        setProductErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
    };

    const handleImagePick = (e) => {
        const file = e.target.files[0];

        if (file) {
            setNewProductImageFile(file);
            setNewProductImage(URL.createObjectURL(file));

            setProductErrors((prev) => ({
                ...prev,
                image: ''
            }));
        }
    };

    const resetProductForm = () => {
        setNewProduct({ categoryId: '', name: '', qty: '', price: '' });
        setNewProductImage(null);
        setNewProductImageFile(null);
        setProductErrors({});
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleAddProduct = async () => {
        const errors = validateProduct(newProduct);

        if (!newProductImageFile) {
            errors.image = '* Please add a picture';
        }

        // Clear invalid fields visually
        if (errors.name || errors.qty || errors.price) {
            setNewProduct((prev) => ({
                ...prev,
                name: errors.name ? '' : prev.name,
                qty: errors.qty ? '' : prev.qty,
                price: errors.price ? '' : prev.price,
            }));
        }

        setProductErrors(errors);

        if (Object.keys(errors).length > 0) return;

        try {
            const formData = new FormData();
            formData.append('product_category_id', newProduct.categoryId);
            formData.append('product_name', newProduct.name.trim());
            formData.append('price', newProduct.price);
            formData.append('stock_quantity', newProduct.qty);
            formData.append('image', newProductImageFile);

            await createProduct(formData);
            resetProductForm();
            fetchData(); // Refresh list to get the new product with its DB ID and image URL
        } catch (err) {
            alert(err.message || 'Failed to create product');
        }
    };

    const handleClearProduct = resetProductForm;

    // =====================================================================
    // Row editing
    // =====================================================================
    const startEditing = (product) => {
        setEditingRowId(product.product_item_id);
        setEditDraft({ 
            name: product.product_name, 
            price: product.price, 
            stock: product.stock_quantity 
        });
    };

    const handleDraftChange = (field, value) => {
        setEditDraft((prev) => ({ ...prev, [field]: value }));
    };

    const saveRow = async (id) => {
        try {
            await updateProduct(id, {
                product_name: editDraft.name.trim(),
                price: Number(editDraft.price),
                stock_quantity: Number(editDraft.stock)
            });
            fetchData();
            setEditingRowId(null);
        } catch (err) {
            alert(err.message || 'Failed to update product');
        }
    };

    const changeRowStatus = async (id, newStatus) => {
        try {
            // Use the new status-specific API function instead of updateProduct
            await updateProductStatus(id, newStatus);
            fetchData();
            setOpenRowStatusId(null);
        } catch (err) {
            alert(err.message || 'Failed to update product status');
        }
    };

    const filteredProducts = products.filter((p) => {
        const matchesSearch = p.product_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || p.category_name === categoryFilter;
        const matchesStatus = statusFilter === 'All' || (p.status || 'Active') === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    const statusColumnLabel = statusFilter === 'All' ? 'Status' : statusFilter;

    return (
        <div className="inv-page">
            <div className="inv-top">
                {/* ---------- Inventory Overview ---------- */}
                    <section className="ovw-panel">
                        <h2 className="ovw-title">Inventory Overview</h2>
                        <div className="ovw-row ovw-row-3">
                            <div className="ovw-stat">
                                <span className="ovw-label">Total Products</span>
                                <span className="ovw-value">{stats.totalProducts}</span>
                            </div>
                            <span className="ovw-divider" aria-hidden="true" />
                            <div className="ovw-stat">
                                <span className="ovw-label">Total Stock</span>
                                <span className="ovw-value">{stats.totalStock}</span>
                            </div>
                            <span className="ovw-divider" aria-hidden="true" />
                            <div className="ovw-stat">
                                <span className="ovw-label">Inventory Value</span>
                                <span className="ovw-value">
                                    {stats.inventoryValue.toLocaleString(undefined, {
                                        style: 'currency',
                                        currency: 'PHP',
                                        minimumFractionDigits: 0,
                                    })}
                                </span>
                            </div>
                        </div>

                        <div className="ovw-row ovw-row-4">
                            <div className="ovw-stat">
                                <span className="ovw-label">Low Stock</span>
                                <span className="ovw-value">{stats.lowStock}</span>
                            </div>
                            <span className="ovw-divider" aria-hidden="true" />
                            <div className="ovw-stat">
                                <span className="ovw-label">Out of Stock</span>
                                <span className="ovw-value">{stats.outOfStock}</span>
                            </div>
                            <span className="ovw-divider" aria-hidden="true" />
                            <div className="ovw-stat">
                                <span className="ovw-label">Active</span>
                                <span className="ovw-value">{stats.active}</span>
                            </div>
                            <span className="ovw-divider" aria-hidden="true" />
                            <div className="ovw-stat">
                                <span className="ovw-label">Inactive</span>
                                <span className="ovw-value">{stats.inactive}</span>
                            </div>
                        </div>
                    </section>

                {/* ---------- Add Product / Category ---------- */}
                <section className="apc-panel">
                    <h2 className="apc-header">Add Product / Category</h2>

                    <div className="apc-body">
                        {/* ----- Add New Category ----- */}
                        <div className="apc-col apc-col-category">
                            <h3 className="apc-subtitle">Add New Category</h3>

                            <div className="apc-col-content">
                                <div className="apc-category-fields">
                                    <div className="apc-field-group">
                                        <label className={`apc-field ${categoryError ? 'apc-field-invalid' : ''}`}>
                                            <span>Name:</span>
                                            <div className="apc-input-wrap">
                                                <input
                                                    type="text"
                                                    maxLength={30}
                                                    value={newCategoryName}
                                                    aria-invalid={!!categoryError}
                                                    onChange={(e) => handleCategoryNameChange(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                                />
                                                {categoryError && <span className="apc-error" role="alert">{categoryError}</span>}
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div className="apc-actions">
                                    <button type="button" className="apc-btn apc-btn-clear" onClick={handleClearCategory}>
                                        CLEAR
                                    </button>
                                    <button type="button" className="apc-btn apc-btn-add" onClick={handleAddCategory}>
                                        ADD
                                    </button>
                                </div>
                            </div>
                        </div>


                        <div className="apc-col apc-col-product">
                            <h3 className="apc-subtitle">Add New Product</h3>

                            <div className="apc-col-content">
                                <div className="apc-product-grid">
                                    <div className="apc-product-fields">
                                        <label className={`apc-field ${productErrors.categoryId ? 'apc-field-invalid' : ''}`}>
                                            <span>Category:</span>
                                            <span className="apc-select-wrap">
                                                <select
                                                    value={newProduct.categoryId}
                                                    aria-invalid={!!productErrors.categoryId}
                                                    onChange={(e) => handleProductFieldChange('categoryId', e.target.value)}
                                                >
                                                    <option value="">Select Category</option>
                                                    {categories.map((cat) => (
                                                        <option key={cat.product_category_id} value={cat.product_category_id}>
                                                            {cat.category_name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {productErrors.categoryId && <span className="apc-error" role="alert">{productErrors.categoryId}</span>}
                                                <img src={DropdownIcon} alt="" className="apc-select-icon" />
                                            </span>
                                        </label>

                                        <label className={`apc-field ${productErrors.name ? 'apc-field-invalid' : ''}`}>
                                            <span>Name:</span>
                                            <div className="apc-input-wrap">
                                                <input
                                                    type="text"
                                                    maxLength={60}
                                                    value={newProduct.name}
                                                    aria-invalid={!!productErrors.name}
                                                    onChange={(e) => handleProductFieldChange('name', e.target.value)}
                                                />
                                                {productErrors.name && <span className="apc-error" role="alert">{productErrors.name}</span>}
                                            </div>
                                        </label>

                                        <label className={`apc-field ${productErrors.qty ? 'apc-field-invalid' : ''}`}>
                                            <span>Qty:</span>
                                            <div className="apc-input-wrap">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={newProduct.qty}
                                                    aria-invalid={!!productErrors.qty}
                                                    onChange={(e) => handleProductFieldChange('qty', e.target.value)}
                                                />
                                                {productErrors.qty && <span className="apc-error" role="alert">{productErrors.qty}</span>}
                                            </div>
                                        </label>

                                        <label className={`apc-field ${productErrors.price ? 'apc-field-invalid' : ''}`}>
                                            <span>Price:</span>
                                            <div className="apc-input-wrap">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={newProduct.price}
                                                    aria-invalid={!!productErrors.price}
                                                    onChange={(e) => handleProductFieldChange('price', e.target.value)}
                                                />
                                                {productErrors.price && <span className="apc-error" role="alert">{productErrors.price}</span>}
                                            </div>
                                        </label>
                                    </div>

                                    <div className="apc-upload-wrap">

                                        <button
                                            type="button"
                                            className={`apc-upload ${productErrors.image ? 'apc-upload-invalid' : ''}`}
                                            aria-label="Upload product photo"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {newProductImage ? (
                                                <img
                                                    src={newProductImage}
                                                    alt="Preview"
                                                    className="apc-upload-preview"
                                                />
                                            ) : (
                                                <img
                                                    src={UploadPhotoIcon}
                                                    alt=""
                                                    className="apc-upload-icon"
                                                />
                                            )}
                                        </button>

                                        {productErrors.image && (
                                            <span className="apc-error apc-image-error" role="alert">
                                                {productErrors.image}
                                            </span>
                                        )}

                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="apc-file-input"
                                        onChange={handleImagePick}
                                    />
                                </div>

                                <div className="apc-actions">
                                    <button type="button" className="apc-btn apc-btn-clear" onClick={handleClearProduct}>
                                        CLEAR
                                    </button>
                                    <button type="button" className="apc-btn apc-btn-add" onClick={handleAddProduct}>
                                        ADD
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* ---------- Full Product Inventory List ---------- */}
            <section className="inv-panel inv-list-panel">
                <div className="inv-list-toolbar">
                    <div className="inv-search-wrapper">
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="inv-search-input"
                        />
                        <span className="inv-search-icon">🔍</span>
                    </div>

                    <div className="inv-filter-dropdown-wrapper">
                        <button
                            type="button"
                            className="inv-filter-btn"
                            onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                        >
                            <span>{categoryFilter === 'All' ? 'Filter by Category' : categoryFilter}</span>
                            <img src={DropdownIcon} alt="" className="inv-filter-caret" />
                        </button>

                        {isCategoryDropdownOpen && (
                            <div className="inv-filter-menu">
                                <button
                                    type="button"
                                    className="inv-filter-option"
                                    onClick={() => {
                                        setCategoryFilter('All');
                                        setIsCategoryDropdownOpen(false);
                                    }}
                                >
                                    All
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        type="button"
                                        key={cat.product_category_id}
                                        className="inv-filter-option"
                                        onClick={() => {
                                            setCategoryFilter(cat.category_name);
                                            setIsCategoryDropdownOpen(false);
                                        }}
                                    >
                                        {cat.category_name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <select
                        className="inv-status-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        aria-label="Filter by status"
                    >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>

                    <h2 className="inv-list-title">Full Product Inventory List</h2>
                </div>

                <div className="inv-table-wrapper">
                    <div className="inv-head">
                        <span>Category_Name</span>
                        <span>Product_Item_Id</span>
                        <span>Product_Name</span>
                        <span>Price</span>
                        <span>Stock_Quantity</span>
                        <span>Total Price</span>

                        <span className="inv-status-head-wrapper">
                            <button
                                type="button"
                                className="inv-status-head-btn"
                                onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
                            >
                                {statusColumnLabel}
                                <img src={DropdownIcon} alt="" className="inv-head-caret" />
                            </button>

                            {isStatusDropdownOpen && (
                                <div className="inv-filter-menu inv-status-menu">
                                    {['All', 'Active', 'Inactive'].map((option) => (
                                        <button
                                            type="button"
                                            key={option}
                                            className="inv-filter-option"
                                            onClick={() => {
                                                setStatusFilter(option);
                                                setIsStatusDropdownOpen(false);
                                            }}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </span>
                        <span>Action</span>
                    </div>

                    <div className="inv-list">
                        {filteredProducts.length === 0 ? (
                            <p className="inv-empty">No products found.</p>
                        ) : (
                            filteredProducts.map((p) => {
                                const isEditing = editingRowId === p.product_item_id;
                                const totalPrice = p.price * p.stock_quantity;
                                const displayStatus = p.status || 'Active'; // Fallback if backend hasn't saved status yet

                                return (
                                    <div className="inv-item" key={p.product_item_id}>
                                        <div className="inv-cell" data-label="Category">
                                            {p.category_name}
                                        </div>

                                        <div className="inv-cell" data-label="Item ID">
                                            {p.product_item_id}
                                        </div>

                                        <div className="inv-cell inv-cell-name" data-label="Product">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    className="inv-edit-input"
                                                    value={editDraft.name}
                                                    onChange={(e) => handleDraftChange('name', e.target.value)}
                                                />
                                            ) : (
                                                p.product_name
                                            )}
                                        </div>

                                        <div className="inv-cell" data-label="Price">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    className="inv-edit-input"
                                                    value={editDraft.price}
                                                    onChange={(e) => handleDraftChange('price', e.target.value)}
                                                />
                                            ) : (
                                                `₱${Number(p.price).toFixed(0)}`
                                            )}
                                        </div>

                                        <div className="inv-cell" data-label="Stock">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    className="inv-edit-input"
                                                    value={editDraft.stock}
                                                    onChange={(e) => handleDraftChange('stock', e.target.value)}
                                                />
                                            ) : (
                                                p.stock_quantity
                                            )}
                                        </div>

                                        <div className="inv-cell" data-label="Total">
                                            ₱{totalPrice.toFixed(0)}
                                        </div>
                                        
                                        <div className="inv-cell inv-cell-status" data-label="Status">
                                            <div className="inv-row-status-dropdown">

                                                {/* Current Status Button */}
                                                <button
                                                    type="button"
                                                    className={`inv-status-pill ${
                                                        displayStatus === 'Active'
                                                            ? 'inv-status-active'
                                                            : 'inv-status-inactive'
                                                    }`}
                                                    onClick={() => {
                                                        setOpenRowStatusId(
                                                            openRowStatusId === p.product_item_id
                                                                ? null
                                                                : p.product_item_id
                                                        );
                                                    }}
                                                >
                                                    <img
                                                        src={
                                                            displayStatus === 'Active'
                                                                ? GreenCircleIcon
                                                                : GreyCircleIcon
                                                        }
                                                        alt=""
                                                        className="inv-status-dot"
                                                    />

                                                    {displayStatus.toUpperCase()}

                                                    <img
                                                        src={DropdownIcon}
                                                        alt=""
                                                        className="inv-pill-caret"
                                                    />
                                                </button>

                                                {/* Status Dropdown */}
                                                {openRowStatusId === p.product_item_id && (
                                                    <div className="inv-row-status-menu">

                                                        <button
                                                            type="button"
                                                            className="inv-row-status-option"
                                                            onClick={() => changeRowStatus(p.product_item_id, 'Active')}
                                                        >
                                                            <img
                                                                src={GreenCircleIcon}
                                                                alt=""
                                                                className="inv-row-status-dot"
                                                            />
                                                            ACTIVE
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="inv-row-status-option"
                                                            onClick={() => changeRowStatus(p.product_item_id, 'Inactive')}
                                                        >
                                                            <img
                                                                src={GreyCircleIcon}
                                                                alt=""
                                                                className="inv-row-status-dot"
                                                            />
                                                            INACTIVE
                                                        </button>

                                                    </div>
                                                )}

                                            </div>
                                        </div>

                                        <div className="inv-cell inv-cell-action" data-label="Action">
                                            <div className="inv-action-buttons">
                                                {isEditing ? (
                                                    <button
                                                        type="button"
                                                        className="inv-action-btn inv-save-btn"
                                                        onClick={() => saveRow(p.product_item_id)}
                                                    >
                                                        <img src={SaveIcon} alt="Save" />
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="inv-action-btn inv-edit-btn"
                                                            onClick={() => startEditing(p)}
                                                        >
                                                            <img src={EditIcon} alt="" /> EDIT
                                                        </button>
                                                        <button type="button" className="inv-action-btn inv-save-btn-idle" disabled>
                                                            <img src={SaveIcon} alt="Save" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default InventoryViewAdmin;