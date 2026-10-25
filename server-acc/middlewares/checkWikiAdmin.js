const WIKI_ADMIN_ROLES = ['WIKI_ADMIN', 'SUPER_ADMIN'];

export const checkWikiAdmin = (req, res, next) => {
  if (WIKI_ADMIN_ROLES.includes(req.user?.role)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. Wiki administrator permissions are required.',
  });
};
