import { baseApi } from "./baseApi";

export const doctorsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDoctorOptions: build.query({
      async queryFn(active, _api, _extra, baseQuery) {
        const records = [];
        let page = 1;
        let totalPages = 1;
        do {
          const result = await baseQuery({
            url: "/doctors",
            params: {
              page,
              limit: 100,
              ...(active === true && { active: true }),
            },
          });
          if (result.error) return { error: result.error };
          records.push(...result.data.data);
          totalPages = result.data.meta?.totalPages || 1;
          page += 1;
        } while (page <= totalPages);
        return { data: records };
      },
      providesTags: ["Doctor"],
    }),
    getDoctors: build.query({
      query: (params = {}) => ({ url: "/doctors", params }),
      providesTags: ["Doctor"],
    }),
    getDoctor: build.query({
      query: (id) => `/doctors/${id}`,
      transformResponse: (response) => response.data,
      providesTags: ["Doctor"],
    }),
    addDoctor: build.mutation({
      query: (body) => ({ url: "/doctors", method: "POST", body }),
      invalidatesTags: ["Doctor", "Appointment", "Dashboard"],
    }),
    updateDoctor: build.mutation({
      query: ({ id, ...body }) => ({
        url: `/doctors/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Doctor", "Appointment", "Dashboard"],
    }),
    deleteDoctor: build.mutation({
      query: (id) => ({ url: `/doctors/${id}`, method: "DELETE" }),
      invalidatesTags: ["Doctor", "Dashboard"],
    }),
  }),
});
export const {
  useGetDoctorOptionsQuery,
  useGetDoctorsQuery,
  useGetDoctorQuery,
  useAddDoctorMutation,
  useUpdateDoctorMutation,
  useDeleteDoctorMutation,
} = doctorsApi;
