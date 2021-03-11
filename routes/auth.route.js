require('dotenv').config();
const router = require('express').Router();
const passport = require('passport');
const { check } = require('express-validator');

const authControllers = require('../controllers/auth.controller');

router.post(
	'/register',
	[
		check('email').isEmail().notEmpty(),
		check('password').notEmpty().isString(),
		check('displayName').notEmpty().isString(),
	],
	authControllers.register
);

router.post('/login', authControllers.login);

router.get('/login/failed', (req, res) => {
	res.status(401).json({
		success: false,
		message: 'User failed to authenticate',
	});
});

router.get(
	'/facebook',
	passport.authenticate('facebook', {
		session: false,
	})
);

router.get(
	'/facebook/callback',
	passport.authenticate('facebook', {
		failureRedirect: '/auth/login/failed',
		session: false,
	}),
	authControllers.socialLogin
);

router.get(
	'/google',
	passport.authenticate('google', {
		session: false,
		scope: ['profile', 'email'],
	})
);

router.get(
	'/google/callback',
	passport.authenticate('google', {
		failureRedirect: '/auth/login/failed',
		session: false,
	}),
	authControllers.socialLogin
);

router.get('/logout', authControllers.logout);

module.exports = router;
