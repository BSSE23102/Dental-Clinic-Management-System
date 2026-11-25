export function validate(schema, source) {
  return (request, _response, next) => {
    request.validated ||= {};
    request.validated[source] = schema.parse(request[source]);
    next();
  };
}
