require('dotenv').config();
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const HttpError = require('../models/http-error');
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
	newLocal.password = await newLocal.generateHash(password);

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

	res.status(201).json({ message: 'Create account successfully!!!' });
};

const login = async (req, res, next) => {
	passport.authenticate('local', async (err, user, info) => {
		try {
			if (err || !user) {
				const error = new HttpError(
					'Incorrect email or password please try again',
					401
				);
				return next(error);
			}

			req.login(user, { session: false }, async (error) => {
				if (error) return next(error);

				const userId = user;

				const accessToken = jwt.sign(
					{ userId },
					process.env.ACCESS_TOKEN_SERCRET_KEY,
					{
						expiresIn: '120d',
					}
				);

				res.cookie('access_token', accessToken, {
					maxAge: 24 * 60 * 60 * 120 * 1000,
					httpOnly: true,
				});

				res.cookie('c_user', userId, {
					maxAge: 24 * 60 * 60 * 120 * 1000,
				});

				return res.status(200).json({ message: 'Login successfully!!' });
			});
		} catch (error) {
			return next(error);
		}
	})(req, res, next);
};

const socialLogin = (req, res) => {
	const userId = req.user;

	const accessToken = jwt.sign(
		{ userId },
		process.env.ACCESS_TOKEN_SERCRET_KEY,
		{
			expiresIn: '120d',
		}
	);

	res.cookie('access_token', accessToken, {
		maxAge: 1000 * 24 * 60 * 60,
		httpOnly: true,
	});

	res.cookie('c_user', userId, {
		maxAge: 24 * 60 * 60 * 120 * 1000,
	});

	res.redirect(process.env.CLIENT_HOME_PAGE_URL);
};

const logout = (req, res) => {
	res.clearCookie('access_token');
	res.clearCookie('c_user');

	res.json({
		logout: true,
	});
};

exports.register = register;
exports.login = login;
exports.socialLogin = socialLogin;
exports.logout = logout;
