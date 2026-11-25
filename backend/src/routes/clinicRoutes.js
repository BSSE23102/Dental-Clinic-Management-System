import { Router } from 'express';
import { doctorsController } from '../controllers/doctorsController.js';
import { appointmentsController } from '../controllers/appointmentsController.js';
import { doctorsService } from '../services/doctorsService.js';
import { appointmentsService } from '../services/appointmentsService.js';
import { dashboardService } from '../services/dashboardService.js';
import { validate } from '../middleware/validate.js';
import { appointmentBody, appointmentQuery, doctorBody, doctorQuery, emptyQuery, idParams, statusBody } from '../schemas/clinic.js';
import { AppError } from '../utils/errors.js';

export function clinicRoutes(pool) {
  const router = Router(); const doctors = doctorsController(doctorsService(pool)); const appointments = appointmentsController(appointmentsService(pool)); const dashboard = dashboardService(pool);
  const id = validate(idParams, 'params'); const noQuery = validate(emptyQuery, 'query');
  router.get('/health', noQuery, async (_req, res) => { try { await pool.query({ text: 'SELECT 1', query_timeout: 2000 }); res.json({ data: { status: 'ok', database: 'up' } }); } catch { throw new AppError(503, 'DATABASE_UNAVAILABLE', 'The clinic service is temporarily unavailable. Please try again shortly.'); } });
  router.get('/doctors', validate(doctorQuery, 'query'), doctors.list);
  router.post('/doctors', noQuery, validate(doctorBody, 'body'), doctors.create);
  router.get('/doctors/:id', id, noQuery, doctors.get);
  router.put('/doctors/:id', id, noQuery, validate(doctorBody, 'body'), doctors.update);
  router.delete('/doctors/:id', id, noQuery, doctors.delete);
  router.get('/appointments', validate(appointmentQuery, 'query'), appointments.list);
  router.post('/appointments', noQuery, validate(appointmentBody, 'body'), appointments.create);
  router.get('/appointments/:id', id, noQuery, appointments.get);
  router.put('/appointments/:id', id, noQuery, validate(appointmentBody, 'body'), appointments.update);
  router.patch('/appointments/:id/status', id, noQuery, validate(statusBody, 'body'), appointments.changeStatus);
  router.delete('/appointments/:id', id, noQuery, appointments.delete);
  router.get('/dashboard/stats', noQuery, async (_req, res) => res.json({ data: await dashboard.stats() }));
  return router;
}
