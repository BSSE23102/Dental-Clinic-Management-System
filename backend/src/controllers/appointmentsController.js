export function appointmentsController(service) {
  return {
    list: async (req, res) => res.json(await service.list(req.validated.query)),
    get: async (req, res) => res.json({ data: await service.get(req.validated.params.id) }),
    create: async (req, res) => { const record = await service.create(req.validated.body); res.location(`/api/appointments/${record.id}`).status(201).json({ data: record }); },
    update: async (req, res) => res.json({ data: await service.update(req.validated.params.id, req.validated.body) }),
    changeStatus: async (req, res) => res.json({ data: await service.changeStatus(req.validated.params.id, req.validated.body.status) }),
    delete: async (req, res) => { await service.delete(req.validated.params.id); res.status(204).end(); },
  };
}
