export function doctorsController(service) {
  return {
    list: async (req, res) => res.json(await service.list(req.validated.query)),
    get: async (req, res) =>
      res.json({ data: await service.get(req.validated.params.id) }),
    create: async (req, res) => {
      const record = await service.create(req.validated.body);
      res
        .location(`/api/doctors/${record.id}`)
        .status(201)
        .json({ data: record });
    },
    update: async (req, res) =>
      res.json({
        data: await service.update(req.validated.params.id, req.validated.body),
      }),
    delete: async (req, res) => {
      await service.delete(req.validated.params.id);
      res.status(204).end();
    },
  };
}
