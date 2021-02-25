const mongoose = require('mongoose');
const HttpError = require('../models/http-error');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Local = require('../models/local.model');

const register = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return next(
			new HttpError('Invalid inputs passed, please check your data.', 422)
		);
	}
	const { email, password, displayName } = req.body;
	let user;
	try {
		user = await User.findOne({
			email: email,
		});
	} catch (err) {
		const error = new HttpError('Register failed, please try again.', 500);
		return next(error);
	}
	if (user) {
		const error = new HttpError('Account already exist', 422);
		return next(error);
	}
	let newLocal = new Local();
	newLocal._id = mongoose.Types.ObjectId().toString();
	newLocal.email = email;
	newLocal.password = newLocal.generateHash(password);
	try {
		await newLocal.save();
	} catch (err) {
		const error = new HttpError('Register failed, please try again.', 500);
		return next(error);
	}

	let newUser = new User();
	newUser._id = newLocal._id;
	newUser.email = email;
	newUser.displayName = displayName;
	newUser.socket = {
		socketId: '',
		isOnline: false,
	};
	try {
		await newUser.save();
	} catch (err) {
		const error = new HttpError('Register failed, please try again.', 500);
		return next(error);
	}
	console.log('okokok');
	res.status(201).json({ message: 'Create account successfully!!!' });
};

const checkLogin = async (req, res, next) => {
	if (req.user) {
		console.log('ok');
		let token;
		try {
			token = jwt.sign({ userId: req.user.id }, process.env.SERCRET_KEY, {
				expiresIn: '1h',
			});
		} catch (err) {
			const error = new HttpError(
				'Signing up failed, please try again later.',
				500
			);
			return next(error);
		}

		res.cookie('access_token', token, {
			maxAge: 24 * 60 * 60,
			httpOnly: true,
		});

		res.json({
			success: true,
			message: 'user has successfully authenticated',
			user: req.user,
			token: token,
		});
	}
};

exports.register = register;
exports.checkLogin = checkLogin;
