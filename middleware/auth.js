// Middleware untuk proteksi route
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  
  // Jika request adalah API, return JSON error
  if (req.path.startsWith('/api')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Please login first.'
    });
  }
  
  // Redirect ke login page
  res.redirect('/login');
}

// Middleware untuk role-based access
function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (req.session.user.role !== role && req.session.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Insufficient permissions.'
      });
    }
    
    next();
  };
}

module.exports = { isAuthenticated, requireRole };
