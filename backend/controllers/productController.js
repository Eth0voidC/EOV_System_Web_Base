const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { pool } = require('../config/db');

// ---------- Image upload (kept in memory, never written to disk) ----------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

// Wraps upload.single('image') so a rejected file comes back as a clean
// 400 JSON message instead of an unhandled server error.
const uploadImage = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Image must be 5 MB or smaller' });
    }
    return res.status(400).json({ error: err.message || 'Invalid image upload' });
  });
};

// ---------- Validation helpers (limits match the column types) ----------
const MAX_PRICE = 99999999.99; // NUMERIC(10,2)
const MAX_STOCK = 2147483647; // INT

// Only real numbers or non-blank strings count; true/[]/{} become NaN
const toNumber = (v) =>
  typeof v === 'number' || (typeof v === 'string' && v.trim() !== '') ? Number(v) : NaN;

const isValidPrice = (v) => {
  const n = toNumber(v);
  return Number.isFinite(n) && n > 0 && n <= MAX_PRICE;
};

const isWholeNumber = (v) => {
  const n = toNumber(v);
  return Number.isInteger(n) && n >= 0 && n <= MAX_STOCK;
};

const isValidName = (v) =>
  typeof v === 'string' && v.trim().length > 0 && v.trim().length <= 60;

// Helper: uploads a file buffer to Cloudinary, returns the result object
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'Products' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(fileBuffer);
  });
};

// POST /api/products — create product with photo in one request (Admin)
const createProduct = async (req, res) => {
  const { product_category_id, product_name, price, stock_quantity } = req.body ?? {};

  const categoryId = toNumber(product_category_id);
  const stock =
    stock_quantity === undefined || stock_quantity === '' ? 0 : toNumber(stock_quantity);

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return res.status(400).json({ error: 'A valid product_category_id is required' });
  }
  if (!isValidName(product_name)) {
    return res.status(400).json({ error: 'Product name must be 1 to 60 characters' });
  }
  if (!isValidPrice(price)) {
    return res.status(400).json({ error: 'Price must be greater than 0' });
  }
  if (!isWholeNumber(stock)) {
    return res.status(400).json({ error: 'Stock must be a whole number (0 or more)' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Product photo is required' });
  }

  let uploadResult;
  let client;
  try {
    // Upload first, so no database connection sits idle during the slow
    // network call.
    uploadResult = await uploadToCloudinary(req.file.buffer);

    client = await pool.connect();
    await client.query('BEGIN');

    const imageResult = await client.query(
      `INSERT INTO product_image (image) VALUES ($1) RETURNING product_image_id`,
      [uploadResult.secure_url]
    );
    const productImageId = imageResult.rows[0].product_image_id;

    const productResult = await client.query(
      `INSERT INTO product_item
        (product_category_id, product_image_id, product_name, price, stock_quantity)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING product_item_id, product_category_id, product_image_id,
                 product_name, price, stock_quantity`,
      [categoryId, productImageId, product_name.trim(), Number(price), stock]
    );

    await client.query('COMMIT');

    res.status(201).json({
      ...productResult.rows[0],
      image: uploadResult.secure_url,
    });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});

    // The photo is already on Cloudinary but nothing in the database points
    // to it, so remove it instead of leaving an orphan behind.
    if (uploadResult) {
      cloudinary.uploader.destroy(uploadResult.public_id).catch(() => {});
    }

    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid product_category_id' });
    }
    if (err.code === '23505') {
      return res.status(409).json({ error: 'This product already exists in this category' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    if (client) client.release();
  }
};

// GET /api/products — list products with category, image and status
//   /api/products               -> every product
//   /api/products?status=active -> Active only (Staff Product page)
const getAllProducts = async (req, res) => {
  try {
    const activeOnly = req.query.status === 'active';

    const result = await pool.query(
      `SELECT pi.product_item_id, pi.product_name, pi.price, pi.stock_quantity,
              pc.product_category_id, pc.category_name,
              img.product_image_id, img.image,
              ps.name AS status
       FROM product_item pi
       JOIN product_category pc ON pi.product_category_id = pc.product_category_id
       JOIN product_status ps ON pi.product_status_id = ps.id
       LEFT JOIN product_image img ON pi.product_image_id = img.product_image_id
       WHERE (NOT $1::boolean OR ps.name = 'Active')
       ORDER BY pi.product_name`,
      [activeOnly]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/products/:id — Admin edits name, price, stock (row EDIT + save)
const updateProduct = async (req, res) => {
  const id = Number(req.params.id);
  const { product_name, price, stock_quantity } = req.body ?? {};

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid product id' });
  }
  if (product_name === undefined && price === undefined && stock_quantity === undefined) {
    return res.status(400).json({ error: 'Nothing to update' });
  }
  if (product_name !== undefined && !isValidName(product_name)) {
    return res.status(400).json({ error: 'Product name must be 1 to 60 characters' });
  }
  if (price !== undefined && !isValidPrice(price)) {
    return res.status(400).json({ error: 'Price must be greater than 0' });
  }
  if (stock_quantity !== undefined && !isWholeNumber(stock_quantity)) {
    return res.status(400).json({ error: 'Stock must be a whole number (0 or more)' });
  }

  try {
    const result = await pool.query(
      `UPDATE product_item
       SET product_name   = COALESCE($1, product_name),
           price          = COALESCE($2, price),
           stock_quantity = COALESCE($3, stock_quantity)
       WHERE product_item_id = $4
       RETURNING product_item_id, product_name, price, stock_quantity`,
      [
        product_name !== undefined ? product_name.trim() : null,
        price !== undefined ? Number(price) : null,
        stock_quantity !== undefined ? Number(stock_quantity) : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'This product already exists in this category' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// PATCH /api/products/:id/status — Admin sets Active / Inactive (status dropdown)
const updateProductStatus = async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body ?? {};

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid product id' });
  }
  if (!['Active', 'Inactive'].includes(status)) {
    return res.status(400).json({ error: 'Status must be Active or Inactive' });
  }

  try {
    const result = await pool.query(
      `UPDATE product_item
       SET product_status_id = (SELECT id FROM product_status WHERE name = $1)
       WHERE product_item_id = $2
       RETURNING product_item_id`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json({ product_item_id: result.rows[0].product_item_id, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  upload,
  uploadImage,
  createProduct,
  getAllProducts,
  updateProduct,
  updateProductStatus,
};