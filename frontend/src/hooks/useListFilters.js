import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
export function useListFilters(keys) {
  const [params, setParams] = useSearchParams();
  const rawPage = Number(params.get("page") || 1);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const filters = Object.fromEntries(
    keys.map((key) => [key, params.get(key) || ""]),
  );
  const query = useDebouncedValue(filters.q || "");
  const update = (key, value) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, String(value));
        else next.delete(key);
        if (key !== "page") next.delete("page");
        return next;
      },
      { replace: true },
    );
  const reset = () => setParams({});
  const apiParams = {
    ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)),
    q: query || undefined,
    page,
    limit: 8,
  };
  return { filters, page, update, reset, apiParams };
}
