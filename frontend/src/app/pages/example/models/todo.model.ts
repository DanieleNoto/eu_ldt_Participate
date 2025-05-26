import { BaseModel } from '@app/core/api-client/models/base.model';
import { TodoDTO } from '../dtos/todo.dto';

export interface TodoModel {
	userId: number;
	id: number;
	title: string;
	completed: boolean;
}

export class TodoModel extends BaseModel<TodoDTO> {
	public static fromDto(dto: TodoDTO): TodoModel {
		return {
			userId: dto.userId,
			id: dto.id,
			title: dto.title,
			completed: dto.completed,
			_dto: dto
		};
	}
}
