import { ApiClient } from '@app/core/api-client/api-client';
import { BackendApiName } from '@config/api-config';
import { TodoModel } from '../models/todo.model';

export const fetchTodos: () => Promise<TodoModel[]> = async () => {
	const response = await ApiClient.request({
		apiName: BackendApiName.FETCH_TODOS,
		model: TodoModel
	});
	return response as TodoModel[];
};
