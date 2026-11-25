import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiUrl, previewMode } from '../utils/environment';

const fetchQuery = fetchBaseQuery({ baseUrl: apiUrl, timeout: 90_000, prepareHeaders: (headers) => { headers.set('accept', 'application/json'); return headers; } });
export const baseApi = createApi({
  reducerPath: 'clinicApi',
  baseQuery: async (args, api, extraOptions) => {
    if (import.meta.env.DEV && previewMode) {
      const { previewQuery } = await import('../mocks/previewApi');
      return previewQuery(args);
    }
    return fetchQuery(args, api, extraOptions);
  },
  tagTypes: ['Doctor', 'Appointment', 'Dashboard'],
  refetchOnFocus: true, refetchOnReconnect: true,
  endpoints: () => ({}),
});
