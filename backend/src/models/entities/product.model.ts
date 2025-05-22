import { Column, DataType, IsUUID, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table({
	tableName: 'products',
	timestamps: true,
	underscored: true
})
export default class Product extends Model<Product> {
	@IsUUID(4)
	@PrimaryKey
	@Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true, field: 'id' })
	declare id: string;

	@Column({
		type: DataType.STRING,
		field: 'name'
	})
	declare name: string;
}
