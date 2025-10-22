/**
 * Standardized API response utility
 */

const sendResponse = (res, statusCode, success, message, data = null, error = null) => {
  const response = {
    success,
    message,
    ...(data && { data }),
    ...(error && { error })
  };

  return res.status(statusCode).json(response);
};

const sendSuccess = (res, message, data = null, statusCode = 200) => {
  return sendResponse(res, statusCode, true, message, data);
};

const sendError = (res, message, error = null, statusCode = 400) => {
  return sendResponse(res, statusCode, false, message, null, error);
};

const sendServerError = (res, message = 'Internal Server Error', error = null) => {
  return sendResponse(res, 500, false, message, null, error);
};

const sendNotFound = (res, message = 'Resource not found') => {
  return sendResponse(res, 404, false, message);
};

const sendUnauthorized = (res, message = 'Unauthorized access') => {
  return sendResponse(res, 401, false, message);
};

const sendForbidden = (res, message = 'Forbidden access') => {
  return sendResponse(res, 403, false, message);
};

module.exports = {
  sendResponse,
  sendSuccess,
  sendError,
  sendServerError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden
};
