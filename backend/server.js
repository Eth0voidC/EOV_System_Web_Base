const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes'); 

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));