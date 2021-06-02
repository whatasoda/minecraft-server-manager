import React from 'react';
import ReactDOM from 'react-dom';
import '@blueprintjs/core/lib/css/blueprint.css';
import App from './App';

const render = () => {
  const container = document.getElementById('app');
  ReactDOM.render(<App />, container);
};

render();
