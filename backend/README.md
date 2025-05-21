# euldt-ucs-manager-be

## 📌 Project Information

- **Name**: `euldt-ucs-manager-be`
- **Version**: `1.0.0`
- **Description**: Project template for Node.js with Fastify in TypeScript
- **Main Entry Point**: `build/app.js`
- **Logger**: [`pino`](https://github.com/pinojs/pino)
- **Database ORM**: [`Sequelize`](https://sequelize.org/)
- **Validation**: [`Zod`](https://zod.dev/)
- **API Documentation**: [`Fastify Swagger`](https://github.com/fastify/fastify-swagger)

## 📜 How to Run the Project

```sh
npm install      # Install dependencies
npm run dev      # Start the Fastify server
npm run test     # Run unit tests
```

### API Documentation:

The API documentation is available at: **[http://localhost:3000/documentation](http://localhost:3000/documentation)**

## 🚀 Commit Conventions

This project follows Conventional Commits:

```plaintext
<type>(<scope>): <message>
```

Types:

- feat: New feature.
- fix: Bug fix.
- chore: Maintenance tasks.
- docs: Documentation updates.
- test: Adding or updating tests.
- refactor: Code refactoring without changing functionality.

## ✅ TODO Conventions

- **[HIGH]** Critical tasks.
- **[MEDIUM]** Important but non-urgent tasks.
- **[LOW]** Nice-to-have improvements.
- Includes date and author.

**Example:**

```javascript
// TODO [HIGH][20250205][JohnDoe]: Implement Redis caching for performance.
```

## 📂 Directory Overview

```
/src
├── config/ # Configuration files (DB, Swagger, Logger)
├── routes/ # API route definitions
├── controllers/ # Handles requests and responses
├── models/ # Sequelize models for database tables
├── schemas/ # Zod schemas for request validation
├── services/ # Business logic and database operations
├── plugins/ # Fastify plugins (passport, i18next)
├── utils/ # Utility functions (logger, JWT helper)
├── i18n/ # Translation files for internationalization
├── middlewares/ # Middleware (error handler, request logger)
```

### 📂 /routes/

This directory contains all the route definitions for the Fastify application.

#### Purpose

- Defines HTTP endpoints (`GET`, `POST`, `PUT`, `DELETE`).
- Maps API requests to the appropriate **controller**.
- Configures metadata such as validation schemas and Swagger documentation.

#### Example

```typescript
import { FastifyInstance } from 'fastify';
import { ProductController } from '../controllers/product.controller';

export default async function authRoutes(app: FastifyInstance) {
	app.get('/products', ProductController.getAllProducts);
	app.post('/products', ProductController.createProduct);
}
```

### 📂 /controllers/

This directory contains all the controllers that handle incoming HTTP requests.

#### Purpose

- Receives the request from the **route**.
- Validates and processes the request.
- Calls the **service** to retrieve or manipulate data.
- Sends the appropriate HTTP response.

#### Purpose

Example

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthDataService } from '../services/product.service';

export class ProductController {
	static async getAllProducts(req: FastifyRequest, reply: FastifyReply) {
		const products = await AuthDataService.getAllProducts();
		return reply.send(products);
	}
}
```

### 📂 /models/entities

This directory contains all Sequelize models representing database tables.

#### Purpose

- Defines the structure of the database tables.
- Specifies data types, constraints, and relationships.
- Provides ORM functionality for interacting with the database.

#### Example

```typescript
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Product extends Model {
	public id!: string;
	public name!: string;
	public price!: number;
}

Product.init(
	{
		id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
		name: { type: DataTypes.STRING, allowNull: false },
		price: { type: DataTypes.FLOAT, allowNull: false }
	},
	{ sequelize, tableName: 'products', timestamps: true }
);
```

### 📂 /schemas/

This directory contains validation schemas using **Zod**.

#### Purpose

- Ensures incoming API data is valid before processing.
- Provides clear validation errors to clients.
- Keeps validation logic separate from business logic.

#### Example

```typescript
import { z } from 'zod';

export const ProductSchema = z.object({
	name: z.string().min(3, 'Name must have at least 3 characters'),
	price: z.number().positive('Price must be positive')
});
```

### 📂 /services/

This directory contains business logic and database operations.

#### Purpose

- Implements core business rules.
- Interacts with the database using **Sequelize**.
- Provides data to controllers without knowing about HTTP requests.

#### Example

```typescript
import { Product } from '../models/product.model';

export class AuthDataService {
	static async getAllProducts() {
		return await Product.findAll();
	}
}
```

---

### **💡 Summary**

| Directory           | Purpose                                                       |
| ------------------- | ------------------------------------------------------------- |
| **routes/**         | Defines API endpoints and maps them to controllers.           |
| **controllers/**    | Handles HTTP requests, calls services, and returns responses. |
| **models/entities** | Defines database structure using Sequelize.                   |
| **schemas/**        | Validates API input using Zod.                                |
| **services/**       | Implements business logic and interacts with the database.    |

---

### 🚀 **Why This Structure?**

✅ **Separation of Concerns** → Easier maintenance and testing.  
✅ **Scalability** → New features can be added with minimal code changes.  
✅ **Better Code Organization** → Clearly defined responsibilities.

### 🔥 Load Testing with Locust

**Locust** is used for load testing to evaluate API performance under different conditions.

#### **Installation**

```sh
pip install locust
```

#### **Running Load Tests**

To execute the tests, run:

```sh
locust --config locust.conf
```

#### **Example Load Test (`tests/load/auth.load-test.py`)**

```python
from locust import HttpUser, task, between

class ProductLoadTest(HttpUser):
    wait_time = between(1, 2)

    @task(2)
    def get_products(self):
        self.client.get("/products")

    @task(1)
    def create_product(self):
        self.client.post("/products", json={"name": "Load Test Product", "price": 99.99})

    @task(1)
    def get_product_by_id(self):
        self.client.get("/products/test-id")

    @task(1)
    def delete_product(self):
        self.client.delete("/products/test-id")
```
