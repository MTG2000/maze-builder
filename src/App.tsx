import React from 'react';
import Canvas from './containers/Canvas/Canvas';
import { ThemeProvider } from 'styled-components';
import { theme } from './core/theme';
import { Provider } from 'react-redux';
import store from './core/store/store';
import './App.css';
interface Props {}

function App({}: Props) {
  return (
    <div id="app">
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <Canvas />
        </Provider>
      </ThemeProvider>
    </div>
  );
}

export default App;
