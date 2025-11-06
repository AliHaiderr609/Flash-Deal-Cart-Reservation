require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const { connectRedis } = require('./config/redis');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger setup
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Flash Deal Cart Reservation & Checkout API',
      version: '1.0.0',
      description: 'API for managing flash deal product reservations and checkout',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Flash Deal API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      products: '/api/products',
      cart: '/api/cart',
      checkout: '/api/checkout',
      docs: '/api-docs',
    },
  });
});

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Connect to Redis
    await connectRedis();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;

