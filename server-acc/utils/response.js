import { resolveUserPhotos } from '../services/profile/photos.js';

// Standard API response formatting for consistency across controllers

export const success = async (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: await resolveUserPhotos(data),
  });
};

export const paginated = async (res, data, pagination, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: await resolveUserPhotos(data),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page * pagination.limit < pagination.total,
      hasPrev: pagination.page > 1,
    },
  });
};

export const error = (res, message = 'An error occurred', statusCode = 500, err = null) => {
  if (statusCode >= 500 && err) {
    console.error('[API Error]:', err);
  }
  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && err?.message ? { details: err.message } : {}),
  });
};
