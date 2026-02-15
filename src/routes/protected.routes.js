const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const permit = require('../middleware/role');

router.get('/user', auth, (req, res) => {
    res.json({ message: 'Accessible to any logged-in user', userId: req.user.id });
});

router.get('/admin', auth, permit('admin'), (req, res) => {
    res.json({ message: 'Accessible to admins only' });
});

module.exports = router;
