import { useQuery } from '@tanstack/react-query';
import { fetchTodos } from '../../services/example.service';

const Query = () => {
	const todos = useQuery({ queryKey: ['todos'], queryFn: fetchTodos });

	return (
		<>
			{todos.isLoading ?? <span>Loading</span>}
			<div>{todos.data?.map(item => <p key={item.id}>{item.title}</p>)}</div>
		</>
	);
};

export default Query;
