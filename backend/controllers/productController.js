const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { pool } = require('../config/db');

const upload = multer({ storage: multer.memoryStorage() });

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

// POST /api/products — create product with photo in one request
const createProduct = async (req, res) => {
  const { product_category_id, product_name, price, stock_quantity } = req.body;

  if (!product_category_id || !product_name || price === undefined) {
    return res.status(400).json({ error: 'product_category_id, product_name, and price are required' });
  }
  if (typeof product_name !== 'string' || isNaN(price) || Number(price) < 0) {
    return res.status(400).json({ error: 'Invalid product name or price' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Product photo is required' });
  }

  const client = await pool.connect();
  try {
    // Upload to Cloudinary BEFORE opening the transaction — don't hold
    // a DB connection open during the slow network upload.
    const uploadResult = await uploadToCloudinary(req.file.buffer);

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
      [product_category_id, productImageId, product_name.trim(), price, stock_quantity || 0]
    );

    await client.query('COMMIT');

    res.status(201).json({
      ...productResult.rows[0],
      image: uploadResult.secure_url,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});

    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid product_category_id' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

// GET /api/products — list all products with category + image
const getAllProducts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pi.product_item_id, pi.product_name, pi.price, pi.stock_quantity,
              pc.product_category_id, pc.category_name,
              img.product_image_id, img.image
       FROM product_item pi
       JOIN product_category pc ON pi.product_category_id = pc.product_category_id
       LEFT JOIN product_image img ON pi.product_image_id = img.product_image_id
       ORDER BY pi.product_name`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { upload, createProduct, getAllProducts };