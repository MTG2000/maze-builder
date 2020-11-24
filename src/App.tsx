import React from 'react';
import Canvas from './containers/Canvas/Canvas';
import { ThemeProvider } from 'styled-components';
import { theme } from './core/theme';
import { theme as muiTheme } from './core/theme/material-ui';

import { Provider } from 'react-redux';
import store from './core/store/store';
import Header from './containers/Header/Header';
import Settings from './containers/Settings/Settings';
import { ThemeProvider as MuiThemeProvider } from '@material-ui/core/styles';

import './App.css';
interface Props {}

function App({}: Props) {
  return (
    <div id="app">
      <ThemeProvider theme={theme}>
        <MuiThemeProvider theme={muiTheme}>
          <Provider store={store}>
            <Header />
            <Canvas />
            <Settings />
          </Provider>
        </MuiThemeProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
