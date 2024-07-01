# Pizza Order API

This project implements a RESTful API for managing pizza orders, including functionalities for creating, listing, updating, deleting, and completing orders.

## Dependencies

Ensure you have the following installed before running the server:

- Node.js (version 14 or higher)
- npm (Node Package Manager)
- Express.js
- body-parser
- uuid
- async-mutex
- Joi
- xss
- express-basic-auth (for basic authentication, optional)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/pizza-order-api.git
   cd pizza-order-api
   ```

# Pizza Ordering API

## Endpoints

### POST /api/orders

- **Description:** Place a new pizza order.
- **Request Body:**
  ```json
  {
    "size": "large",
    "toppings": ["pepperoni", "mushrooms"],
    "quantity": 2
  }
  ```
