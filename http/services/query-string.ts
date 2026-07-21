export const toQueryString = (
  filters: Record<string, string | number | boolean | undefined | null>,
) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    params.append(key, String(value));
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};
