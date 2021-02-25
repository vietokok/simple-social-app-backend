const express = require('express');
const messageControllers = require('../controllers/message.controller');

const router = express.Router();

router.get('/:friendId', messageControllers.getMessageByRoom);

module.exports = router;
