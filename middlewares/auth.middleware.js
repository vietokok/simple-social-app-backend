require('dotenv').config();
const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');

module.exports = (req, res, next) => {
	if (req.method === 'OPTIONS') {
		return next();
	}
	try {
		const token = req.cookies['access_token'];
		const cUser = req.cookies['c_user'];

		if (!cUser || !token) {
			res.clearCookie('access_token');
			res.clearCookie('c_user');

			const error = new HttpError('Authentication failed!', 403);
			return next(error);
		}

		const decodedToken = jwt.verify(
			token,
			process.env.ACCESS_TOKEN_SERCRET_KEY
		);
		req.userData = { userId: decodedToken.userId };
		next();
	} catch (err) {
		const error = new HttpError('Authentication failed!', 403);
		return next(error);
	}
};
