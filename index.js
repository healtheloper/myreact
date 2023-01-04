/** @jsx core.h */
import core from './src/core';
import App from './src/app';

const $app = document.getElementById('app');

core.createRoot($app);
core.render(<App />);
