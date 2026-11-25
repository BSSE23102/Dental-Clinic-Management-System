import { baseApi } from "./baseApi";

export const appointmentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAppointments: build.query({
      query: (params = {}) => ({ url: "/appointments", params }),
      providesTags: ["Appointment"],
    }),
    getAppointment: build.query({
      query: (id) => `/appointments/${id}`,
      transformResponse: (response) => response.data,
      providesTags: ["Appointment"],
    }),
    addAppointment: build.mutation({
      query: (body) => ({ url: "/appointments", method: "POST", body }),
      invalidatesTags: ["Appointment", "Dashboard"],
    }),
    updateAppointment: build.mutation({
      query: ({ id, ...body }) => ({
        url: `/appointments/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Appointment", "Dashboard"],
    }),
    updateAppointmentStatus: build.mutation({
      query: ({ id, status }) => ({
        url: `/appointments/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Appointment", "Dashboard"],
    }),
    deleteAppointment: build.mutation({
      query: (id) => ({ url: `/appointments/${id}`, method: "DELETE" }),
      invalidatesTags: ["Appointment", "Dashboard"],
    }),
  }),
});
export const {
  useGetAppointmentsQuery,
  useGetAppointmentQuery,
  useAddAppointmentMutation,
  useUpdateAppointmentMutation,
  useUpdateAppointmentStatusMutation,
  useDeleteAppointmentMutation,
} = appointmentsApi;
