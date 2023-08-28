import { SvcError } from '../errors';

export type RequestProps = {
  url: string;
  method?: 'GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH';
  query?: Record<string, string>;
  // eslint-disable-next-line no-undef
  headersInit?: HeadersInit;
  data?: any;
  signal?: AbortSignal;
};

export function makeRequest(getToken?: () => Promise<string> | string) {
  return async function request<T>({
    url,
    data,
    query,
    method = 'GET',
    headersInit = {
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    signal = undefined,
  }: RequestProps) {
    const getFullUrl = (
      endPoint: string,
      queryParams?: Record<string, string>,
    ) => {
      if (queryParams && Object.keys(queryParams).length > 0) {
        return `${endPoint}?${new URLSearchParams(queryParams)}`;
      }

      return endPoint;
    };

    const headers = new Headers(headersInit);

    if (!headers.has('Authorization') && getToken) {
      const token = await getToken();

      headers.set('Authorization', `Bearer ${token}`);
    }

    const body = data ? JSON.stringify(data) : undefined;

    let response: Response;

    try {
      response = await fetch(getFullUrl(url, query), {
        body,
        headers,
        method,
        signal,
      });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw error;
      } else {
        throw new SvcError(
          'Request failed due to a connectivity issue. Please check your network connection.',
        );
      }
    }

    let responseData: any;

    try {
      responseData = await response.json();
    } catch {
      throw new SvcError('Failed to read server response.');
    }

    if (response.ok) {
      return {
        data: responseData as T,
      };
    }

    throw new SvcError(
      responseData.message || response.statusText,
      responseData.error_code,
      response.status,
    );
  };
}
