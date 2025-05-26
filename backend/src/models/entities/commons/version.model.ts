import { Column, CreatedAt, DataType, IsUUID, Model, PrimaryKey } from 'sequelize-typescript';

export default abstract class Version<Entity extends Model = Model> extends Model {
	@IsUUID(4)
	@PrimaryKey
	@Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true, field: 'id' })
	declare id: string;

	@Column({ type: DataType.FLOAT, field: 'version', allowNull: false, defaultValue: 1.0 })
	declare version: number;

	@Column({ field: 'author' })
	declare author: string;

	@CreatedAt
	@Column({ field: 'creation_date' })
	declare creationDate: Date;

	@Column({ field: 'reason', type: DataType.TEXT })
	declare reason: string;

	@Column({ field: 'data', type: DataType.JSON })
	declare data: Entity;

	@Column({ field: 'original_id' })
	declare abstract originalId: string;
}
