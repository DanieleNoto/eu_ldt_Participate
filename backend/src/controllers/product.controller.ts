import Product from '../models/entities/product.model';
import { ProductIdSchema, ProductRequestSchema } from '../schemas/product.schema';
import ProductService from '../services/product.service';
import { BaseCrudController } from './base/base-crud.controller';

class ProductController extends BaseCrudController<Product, string> {
	protected override service = ProductService;

	protected getIdSchema() {
		return ProductIdSchema;
	}

	protected getRequestSchema() {
		return ProductRequestSchema;
	}
}

export default new ProductController();
