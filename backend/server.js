const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const recordsRoutes = require('./routes/recordsRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('EOV API is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);  
app.use('/api/employees', employeeRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/records', recordsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));