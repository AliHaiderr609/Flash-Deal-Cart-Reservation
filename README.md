# Flash Deal Cart Reservation & Checkout API

A high-performance backend API for managing flash deal product reservations with stock locking, preventing overselling, and handling concurrent requests using Redis for reservations and MongoDB for persistent storage.

## Features

-  **Product Management**: Create products with stock limits
-  **Cart Reservations**: Temporarily reserve stock for users (10-minute TTL)
-  **Auto-Expiry**: Reservations automatically expire and release stock
-  **Checkout**: Finalize purchases and permanently reduce stock
-  **Concurrency Safety**: Prevents overselling even under high load
-  **Multi-SKU Support**: Reserve multiple products in a single transaction
-  **Rate Limiting**: Prevents API abuse
-  **Input Validation**: Comprehensive validation on all endpoints
-  **Error Handling**: Proper error handling throughout

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (for persistent storage)
- **Cache/Reservations**: Redis (for temporary stock locks)
- **Validation**: express-validator
- **Rate Limiting**: express-rate-limit
- **Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or connection string)
- Redis (running locally or connection details)

## Installation

1. Clone the repository:
```bash
git clone <https://github.com/AliHaiderr609/Flash-Deal-Cart-Reservation.git>
cd flash-deal-api-task
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/flash-deal-db

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Reservation Configuration
RESERVATION_TTL_SECONDS=600
```

4. Start MongoDB and Redis:
```bash
# MongoDB (if running locally)
mongod

# Redis (if running locally)
redis-server
```

5. Start the server:
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:3000/api-docs`

## How Reservation Lock Logic Works

### Architecture Overview

The system uses a two-tier storage approach:

1. **MongoDB**: Stores permanent product data (total stock, product info) and completed orders
2. **Redis**: Manages temporary reservations with TTL (Time To Live)

### Reservation Flow

1. **User Adds to Cart**:
   - System checks available stock: `availableStock = totalStock - reservedStock`
   - If available, creates a reservation in Redis with:
     - Key: `reservation:{userId}:{sku}`
     - Value: Reserved quantity
     - TTL: 600 seconds (10 minutes)
   - Increments `reserved_stock:{sku}` counter in Redis
   - Stock is now "locked" and unavailable to other users

2. **Stock Availability Check**:
   - Before reserving, system checks: `totalStock - reservedStock >= requestedQuantity`
   - Uses Redis counters to track real-time reserved stock
   - Prevents overselling by ensuring atomic operations

3. **Concurrency Handling**:
   - Redis operations are atomic (single-threaded)
   - Uses Redis transactions (MULTI/EXEC) for critical operations
   - Stock checks happen before reservation to prevent race conditions

4. **Multi-SKU Reservation**:
   - Validates all SKUs before reserving any
   - Uses transaction rollback: if any SKU fails, all reservations are cancelled
   - Ensures all-or-nothing reservation behavior

### Expiration Mechanism

1. **Automatic Expiry**:
   - Redis TTL automatically expires reservations after 10 minutes
   - When a key expires, Redis removes it
   - The `reserved_stock:{sku}` counter is also set with TTL
   - When reservation expires, stock becomes available again

2. **Manual Cancellation**:
   - User can cancel reservations before expiry
   - System decrements `reserved_stock:{sku}` counter
   - Removes or updates reservation key

3. **Checkout Process**:
   - Validates all reservations are still valid
   - Creates order in MongoDB
   - Permanently reduces stock in MongoDB
   - Releases reservations from Redis
   - Ensures atomicity: if any step fails, entire checkout fails

## API Endpoints

### Products

#### Create Product
```http
POST /api/products
Content-Type: application/json

{
  "name": "Flash Deal Product",
  "sku": "FLASH-001",
  "totalStock": 200,
  "price": 99.99,
  "description": "Limited edition product"
}
```

#### Get Product Status
```http
GET /api/products/{sku}/status
```

Response:
```json
{
  "success": true,
  "data": {
    "productId": "...",
    "name": "Flash Deal Product",
    "sku": "FLASH-001",
    "totalStock": 200,
    "reservedStock": 50,
    "availableStock": 150,
    "price": 99.99,
    "isActive": true
  }
}
```

#### Get All Products
```http
GET /api/products
```

### Cart

#### Reserve Items
```http
POST /api/cart/reserve
Content-Type: application/json

{
  "userId": "user123",
  "items": [
    {
      "sku": "FLASH-001",
      "quantity": 2
    },
    {
      "sku": "FLASH-002",
      "quantity": 1
    }
  ]
}
```

#### Get User Cart
```http
GET /api/cart/{userId}
```

#### Cancel Reservation
```http
POST /api/cart/cancel
Content-Type: application/json

{
  "userId": "user123",
  "items": [
    {
      "sku": "FLASH-001",
      "quantity": 1  // Optional: omit quantity to cancel all
    }
  ]
}
```

### Checkout

#### Process Checkout
```http
POST /api/checkout
Content-Type: application/json

{
  "userId": "user123"
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error message here",
  "errors": [...]  // For validation errors
}
```

Common error scenarios:
- **400 Bad Request**: Validation errors, insufficient stock
- **404 Not Found**: Product not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server errors

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Reservation Endpoints**: 20 requests per minute per IP

## Testing

### Example Flow

1. **Create a product**:
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Flash Deal Product",
    "sku": "FLASH-001",
    "totalStock": 200,
    "price": 99.99
  }'
```

2. **Check product status**:
```bash
curl http://localhost:3000/api/products/FLASH-001/status
```

3. **Reserve items**:
```bash
curl -X POST http://localhost:3000/api/cart/reserve \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "items": [{"sku": "FLASH-001", "quantity": 2}]
  }'
```

4. **View cart**:
```bash
curl http://localhost:3000/api/cart/user123
```

5. **Checkout**:
```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123"}'
```

## Project Structure

```
flash-deal-api-task/
├── src/
│   ├── config/
│   │   ├── database.js      # MongoDB connection
│   │   └── redis.js         # Redis connection
│   ├── models/
│   │   ├── Product.js       # Product model
│   │   └── Order.js         # Order model
│   ├── services/
│   │   ├── redisService.js  # Redis reservation logic
│   │   ├── productService.js # Product business logic
│   │   ├── cartService.js   # Cart business logic
│   │   └── checkoutService.js # Checkout business logic
│   ├── controllers/
│   │   ├── productController.js
│   │   ├── cartController.js
│   │   └── checkoutController.js
│   ├── middleware/
│   │   ├── validation.js    # Input validation rules
│   │   ├── rateLimiter.js   # Rate limiting
│   │   └── errorHandler.js  # Error handling
│   ├── routes/
│   │   ├── productRoutes.js
│   │   ├── cartRoutes.js
│   │   └── checkoutRoutes.js
│   └── server.js            # Main server file
├── package.json
├── .env                     # Environment variables (create from .env.example)
└── README.md
```

## Design Decisions

### Why Redis for Reservations?

- **Performance**: Redis is in-memory, providing sub-millisecond response times
- **TTL Support**: Built-in expiration mechanism perfect for temporary reservations
- **Atomicity**: Single-threaded model ensures atomic operations
- **Concurrency**: Handles high concurrent requests efficiently

### Why MongoDB for Persistent Storage?

- **Flexibility**: Schema-less design for evolving product/order structures
- **Scalability**: Horizontal scaling capabilities
- **Document Model**: Natural fit for product and order data

### Separation of Concerns

- **Controllers**: Handle HTTP requests/responses only
- **Services**: Contain all business logic
- **Models**: Define data structures
- **Middleware**: Reusable cross-cutting concerns

## Future Enhancements

- [ ] WebSocket support for real-time stock updates
- [ ] Order history endpoints
- [ ] User authentication/authorization
- [ ] Product categories and filtering
- [ ] Inventory management dashboard
- [ ] Analytics and reporting

## License

ISC

## Author

Flash Deal API Team

