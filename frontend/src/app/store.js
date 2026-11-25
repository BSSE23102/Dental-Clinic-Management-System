import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { baseApi } from "../services/baseApi";
import ui from "./uiSlice";

export function createStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer, ui },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });
}
export const store = createStore();
setupListeners(store.dispatch);
