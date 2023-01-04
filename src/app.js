/** @jsx core.h */
import core from './core';
// import Todos from './todos';

const App = () => {
  const [me, setMe] = core.useState('Jin', 'app');
  // const [you, setYou] = core.useState('Seok');

  // core.useEffect(() => {
  //   const fetchMe = async () => {
  //     const response = await fetch(
  //       'https://jsonplaceholder.typicode.com/users/1'
  //     );
  //     const json = await response.json();
  //     setMe(json.name);
  //   };
  //   fetchMe();
  // }, []);

  core.useEffect(() => {
    setMe('Park');
  }, []);

  return (
    <div>
      <h1>Hello {me}</h1>
    </div>
  );
};

export default App;
