import { ApiConfigConstructor } from '@app/core/api-client/models/api-config.model';

export enum BackendApiName {
	FETCH_TODOS = 'fetchTodos'
}

export const API_CONFIG: ApiConfigConstructor[] = [
	{
		name: BackendApiName.FETCH_TODOS,
		url: 'https://jsonplaceholder.typicode.com/todos',
		method: 'get'
	}
];
