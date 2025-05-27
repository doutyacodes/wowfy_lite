import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  loading: false,
  error: null,
};

export
 
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action) {
      state.loading = false;
      state.user = action.payload;
      state.error = null;
    },
    loginFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    logout(state) {
      state.user = null;
      AsyncStorage.removeItem('user'); // Remove user data from storage
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload };
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout ,updateUser} = authSlice.actions;
export default authSlice.reducer;