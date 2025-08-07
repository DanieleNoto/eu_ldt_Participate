import { Column, CreatedAt, DataType, IsUUID, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table({ tableName: 'conversations' })
export default class Conversation extends Model<Conversation> {
	@IsUUID(4)
	@PrimaryKey
	@Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true, field: 'id' })
	declare id: string;

	@Column({ type: DataType.UUID, allowNull: false })
	declare conversationId: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare nodeId: string;

	@Column({ type: DataType.TEXT, allowNull: false })
	declare message: string;

	@CreatedAt
	@Column({ type: DataType.DATE })
	declare createdAt: Date;
}
