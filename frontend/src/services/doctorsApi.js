import { baseApi } from './baseApi';

export const doctorsApi = baseApi.injectEndpoints({ endpoints: (build) => ({
  getDoctors: build.query({ query: (params = {}) => ({ url: '/doctors', params }), providesTags: ['Doctor'] }),
  getDoctor: build.query({ query: (id) => `/doctors/${id}`, transformResponse: (response) => response.data, providesTags: ['Doctor'] }),
  addDoctor: build.mutation({ query: (body) => ({ url: '/doctors', method: 'POST', body }), invalidatesTags: ['Doctor', 'Appointment', 'Dashboard'] }),
  updateDoctor: build.mutation({ query: ({ id, ...body }) => ({ url: `/doctors/${id}`, method: 'PUT', body }), invalidatesTags: ['Doctor', 'Appointment', 'Dashboard'] }),
  deleteDoctor: build.mutation({ query: (id) => ({ url: `/doctors/${id}`, method: 'DELETE' }), invalidatesTags: ['Doctor', 'Dashboard'] }),
}) });
export const { useGetDoctorsQuery, useGetDoctorQuery, useAddDoctorMutation, useUpdateDoctorMutation, useDeleteDoctorMutation } = doctorsApi;
