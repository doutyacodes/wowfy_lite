// store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice'; // Import your auth slice

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});
