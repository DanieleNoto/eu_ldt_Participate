import { Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript';

export interface ConversationAttributes {
	conversationId: string;
	nodeId: string;
	message: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export type ConversationCreationAttributes = Omit<ConversationAttributes, 'createdAt' | 'updatedAt'>;

@Table({
	tableName: 'conversations',
	timestamps: true
})
export default class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes> {
	@PrimaryKey
	@Column({
		type: DataType.UUID,
		defaultValue: DataType.UUIDV4
	})
	declare id: string;

	@Column({
		type: DataType.UUID,
		allowNull: false
	})
	declare conversationId: string;

	@Column({
		type: DataType.STRING(255),
		allowNull: false
	})
	declare nodeId: string;

	@Column({
		type: DataType.STRING(1000),
		allowNull: false
	})
	declare message: string;

	@Column({
		type: DataType.DATE,
		allowNull: false,
		defaultValue: DataType.NOW
	})
	declare createdAt: Date;

	@Column({
		type: DataType.DATE,
		allowNull: false,
		defaultValue: DataType.NOW
	})
	declare updatedAt: Date;
}
