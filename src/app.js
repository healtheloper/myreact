/** @jsx core.createElement */
import core from './core';
import Todos from './todos';

const App = () => {
  const [me, setMe] = core.useState('Jin');
  const [you, setYou] = core.useState('Seok');

  console.log('렌더링');

  core.useEffect(() => {
    const fetchMe = async () => {
      const response = await fetch(
        'https://jsonplaceholder.typicode.com/users/1'
      );
      const json = await response.json();
      setMe(json.name);
    };
    fetchMe();
  }, [you]);

  return (
    <div>
      <h1>
        Hello {me} & {you}
      </h1>
      <Todos />
    </div>
  );
};

export default App;
