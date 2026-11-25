import { baseApi } from "./baseApi";
export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDashboard: build.query({
      query: () => "/dashboard/stats",
      transformResponse: (response) => response.data,
      providesTags: ["Dashboard"],
    }),
  }),
});
export const { useGetDashboardQuery } = dashboardApi;
