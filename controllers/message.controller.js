const HttpError = require('../models/http-error');
const mongoose = require('mongoose');
const Message = require('../models/message.model');
const moment = require('moment');
const { validationResult } = require('express-validator');

const getMessageByRoom = async (req, res, next) => {
	const friendId = req.params.friendId;
	const userId = req.userData.userId;
	let messages;
	try {
		messages = await Message.find({
			room: [
				userId.toString() + friendId.toString(),
				friendId.toString() + userId.toString(),
			],
		})
			.populate('from', '-provider')
			.populate('to', '-provider');
	} catch (err) {
		const error = new HttpError('Something went wrong, please try again.', 500);
		return next(error);
	}

	if (!messages) {
		res.json({ message: 'No data' });
	}

	res.json({ messages: messages });
};

exports.getMessageByRoom = getMessageByRoom;
