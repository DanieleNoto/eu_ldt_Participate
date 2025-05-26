import { Column, DataType, Model } from 'sequelize-typescript';
import { StatusEnum } from '../../../enums/status.enum';

export default abstract class Versioned extends Model {
	@Column({ type: DataType.FLOAT, field: 'version', allowNull: false, defaultValue: 1.0 })
	declare version: number;

	@Column({
		type: DataType.ENUM(...Object.values(StatusEnum)),
		allowNull: false,
		defaultValue: StatusEnum.DRAFT
	})
	declare status: StatusEnum;

	@Column({ field: 'author', allowNull: false })
	declare author: string;
}
