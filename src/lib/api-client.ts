export interface ApiErrorDetail {
  message: string;
  field?: string;
}

export interface ApiResponseError {
  error: ApiErrorDetail;
}

export type ApiResponse<T> =
  | {
      ok: true;
      data: T;
      status: number;
    }
  | {
      ok: false;
      error: ApiErrorDetail;
      status: number;
    };

export async function apiFetch<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(input, init);

    if (response.status === 204) {
      return {
        ok: true,
        data: undefined as T,
        status: 204,
      };
    }

    let payload: unknown = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      const errObj = payload as ApiResponseError | null;
      const message =
        errObj?.error?.message ?? `Request failed with status ${response.status}`;
      const field = errObj?.error?.field;

      return {
        ok: false,
        error: { message, field },
        status: response.status,
      };
    }

    return {
      ok: true,
      data: payload as T,
      status: response.status,
    };
  } catch {
    return {
      ok: false,
      error: { message: "Could not reach the server. Check your connection." },
      status: 0,
    };
  }
}
