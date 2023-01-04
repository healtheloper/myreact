/** @jsx core.h */
import core from './core';

const Todos = () => {
  const [todos, setTodos] = core.useState(['밥', '먹', '기'], 'todos');
  const [newTodo, setNewTodo] = core.useState('', 'todos');

  const addTodo = () => {
    if (newTodo === '') return;
    setTodos([...todos, newTodo]);
    setNewTodo('');
  };

  const deleteTodo = (index) => {
    const newTodos = [...todos];
    newTodos.splice(index, 1);
    setTodos(newTodos);
  };

  return (
    <div>
      <h1>Todos</h1>
      <input
        type='text'
        value={newTodo}
        onChange={(e) => {
          setNewTodo(e.target.value);
        }}
      />
      <button onClick={addTodo}>Add</button>
      <ul>
        {todos.map((todo, index) => (
          <li key={`todo-${index}`}>
            {todo}
            <button onClick={() => deleteTodo(index)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Todos;
