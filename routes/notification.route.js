const express = require('express');

const notificationController = require('../controllers/notification.controller');

const router = express.Router();

router.get('/', notificationController.getNotificationsByUser);

router.post('/', notificationController.updateSeenNotification);

module.exports = router;
