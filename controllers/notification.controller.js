const HttpError = require('../models/http-error');
const Notification = require('../models/notification.model');

const getNotificationsByUser = async (req, res, next) => {
	const userId = req.userData.userId;

	let notifications;
	try {
		notifications = await Notification.find({
			userNotiRep: userId,
		})
			.sort({ createdTime: '-1' })
			.populate('userNotiSend', 'displayName');
	} catch (err) {
		const error = new HttpError('Something went wrong, please try again.', 500);
		return next(error);
	}

	res.json({ notifications: notifications });
};

const updateSeenNotification = async (req, res, next) => {
	const userId = req.userData.userId;

	try {
		await Notification.updateMany({ userNotiRep: userId }, { isSeen: true });
	} catch (err) {
		const error = new HttpError('Something went wrong, please try again.', 500);
		return next(error);
	}

	let updateNotifications;
	try {
		updateNotifications = await Notification.find({
			userNotiRep: userId,
		})
			.sort({ createdTime: '-1' })
			.populate('userNotiSend', 'displayName');
	} catch (err) {
		const error = new HttpError('Something went wrong, please try again.', 500);
		return next(error);
	}

	res.json({ notifications: updateNotifications });
};

exports.getNotificationsByUser = getNotificationsByUser;
exports.updateSeenNotification = updateSeenNotification;
