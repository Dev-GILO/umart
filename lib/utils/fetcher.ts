export type FetcherOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
};

export async function fetcher<T = unknown>(
  url: string,
  options: FetcherOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `API error: ${response.status}`);
  }

  return response.json();
}

export async function get<T = unknown>(url: string): Promise<T> {
  return fetcher<T>(url, { method: 'GET' });
}

export async function post<T = unknown>(
  url: string,
  body: Record<string, unknown>
): Promise<T> {
  return fetcher<T>(url, { method: 'POST', body });
}

export async function patch<T = unknown>(
  url: string,
  body: Record<string, unknown>
): Promise<T> {
  return fetcher<T>(url, { method: 'PATCH', body });
}

export async function del<T = unknown>(url: string): Promise<T> {
  return fetcher<T>(url, { method: 'DELETE' });
}
