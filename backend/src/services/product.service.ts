import Product from '../models/entities/product.model';
import { BaseCrudService } from './base/base-crud.service';

class ProductService extends BaseCrudService<Product, string> {
	protected override model = Product;
}

export default new ProductService();
