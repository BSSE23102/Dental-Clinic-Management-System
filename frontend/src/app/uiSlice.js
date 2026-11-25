import { createSlice, nanoid } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui', initialState: { toasts: [] },
  reducers: {
    addToast: { prepare: (message, tone = 'success') => ({ payload: { id: nanoid(), message, tone } }), reducer: (state, action) => { state.toasts.push(action.payload); } },
    removeToast: (state, action) => { state.toasts = state.toasts.filter((toast) => toast.id !== action.payload); },
  },
});
export const { addToast, removeToast } = uiSlice.actions;
export default uiSlice.reducer;
