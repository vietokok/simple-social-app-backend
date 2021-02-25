const express = require('express');
const userControllers = require('../controllers/user.controller');

const router = express.Router();

router.get('/', userControllers.getUserById);
router.get('/all', userControllers.getAllUser);

module.exports = router;
