const permit = (...allowedRoles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const roles = req.user.roles;
    if (roles.some(role => allowedRoles.includes(role))) return next();
    return res.status(403).json({ message: 'Forbidden' });
};

module.exports = permit;
