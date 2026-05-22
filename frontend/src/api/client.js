const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const WS_BASE_URL = API_BASE_URL.replace(/^http/i, "ws");

function formatApiError(detail) {
  if (!detail) return "Something went wrong";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const path = Array.isArray(item.loc) ? item.loc.slice(1).join(" > ") : "";
          const message = item.msg || "Invalid value";
          return path ? `${path}: ${message}` : message;
        }
        return "Invalid request";
      })
      .join(". ");
  }
  if (typeof detail === "object") {
    return detail.message || detail.error || "Something went wrong";
  }
  return "Something went wrong";
}

export async function apiRequest(path, options = {}) {
  const { token, body, headers, isFormData = false, ...rest } = options;
  const requestHeaders = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(headers || {}),
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  if (!response.ok) {
    let errorMessage = "Something went wrong";
    try {
      const errorData = await response.json();
      errorMessage = formatApiError(errorData.detail || errorData);
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response;
}

export { API_BASE_URL, WS_BASE_URL };
