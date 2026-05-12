export const orMiddleware = (mw1, mw2) => {
  return async (req, res, next) => {
    let passed = false;
    let lastError = null;

    const fakeNext = (err) => {
      if (!err) passed = true;
      else lastError = err;
    };

    try {
      await mw1(req, res, fakeNext);

      if (passed) {
        return next();
      }

      passed = false;

      await mw2(req, res, fakeNext);

      if (passed) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    } catch (err) {
      return next(err);
    }
  };
};