import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import DashboardPage from "../pages/DashboardPage";
import DoctorsPage from "../pages/DoctorsPage";
import AppointmentsPage from "../pages/AppointmentsPage";
import {
  AppointmentDetailsPage,
  DoctorDetailsPage,
  NotFoundPage,
} from "../pages/DetailPages";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route path="doctors/:id" element={<DoctorDetailsPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="appointments/:id" element={<AppointmentDetailsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
