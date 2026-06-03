/** Standard success response */
export function success(data = {}, message = 'success') {
  return { code: 0, data, message };
}

/** Standard error response */
export function fail(message = 'error', code = -1) {
  return { code, data: null, message };
}

/** Paginated response */
export function paginated({ list, total, page, pageSize }, message = 'success') {
  return {
    code: 0,
    data: { list, total, page, pageSize },
    message
  };
}
