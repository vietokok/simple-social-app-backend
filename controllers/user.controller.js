const HttpError = require('../models/http-error');
const User = require('../models/user.model');

const getUserById = async (req, res, next) => {
	const userId = req.userData.userId;
	let user;
	try {
		user = await User.findById(userId);
	} catch (err) {
		const error = new HttpError('Something went wrong, please try again.', 500);
		return next(error);
	}

	if (!user) {
		const error = new HttpError(
			'Could not find user for the provided id.',
			404
		);
		return next(error);
	}

	res.json({ user: user.toObject({ getters: true }) });
};

const getAllUser = async (req, res, next) => {
	let users;
	const userId = req.userData.userId;
	try {
		users = await User.find({
			_id: { $ne: userId },
		});
	} catch (err) {
		const error = new HttpError('Something went wrong, please try again.', 500);
		return next(error);
	}

	if (!users) {
		const error = new HttpError('Could not find any user', 404);
		return next(error);
	}

	res.json({ users: users });
};

exports.getUserById = getUserById;
exports.getAllUser = getAllUser;
