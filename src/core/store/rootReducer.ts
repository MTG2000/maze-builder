import { combineReducers } from '@reduxjs/toolkit';
import gridReducer from './slices/grid.slice';
import toolboxReducer from './slices/toolbox.slice';

const rootReducer = combineReducers({
  grid: gridReducer,
  toolBox: toolboxReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
