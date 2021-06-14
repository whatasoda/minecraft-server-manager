import React from 'react';
import ReactDOM from 'react-dom';
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/popover2/lib/css/blueprint-popover2.css';
import App from './App';

const render = () => {
  const container = document.getElementById('app');
  ReactDOM.render(<App />, container);
};

render();
