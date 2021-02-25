require('dotenv').config();
const router = require('express').Router();
const passport = require('passport');
const authControllers = require('../controllers/auth.controller');
const { check } = require('express-validator');

router.post(
	'/register',
	[
		check('email').isEmail().notEmpty(),
		check('password').notEmpty().isString(),
		check('displayName').notEmpty().isString(),
	],
	authControllers.register
);

router.get('/login/success', authControllers.checkLogin);

router.post(
	'/login',
	passport.authenticate('local', { failureRedirect: '/auth/login/failed' }),
	(req, res) => {
		res.status(201).json({ message: 'Login successfully!!' });
	}
);

router.get('/login/failed', (req, res) => {
	res.status(401).json({
		success: false,
		message: 'user failed to authenticate.',
	});
});

router.get('/facebook', passport.authenticate('facebook'));

router.get(
	'/facebook/callback',
	passport.authenticate('facebook', {
		successRedirect: process.env.CLIENT_HOME_PAGE_URL,
		failureRedirect: '/auth/login/failed',
	})
);

router.get(
	'/google',
	passport.authenticate('google', {
		scope: ['profile', 'email'],
	})
);

router.get(
	'/google/callback',
	passport.authenticate('google', {
		successRedirect: process.env.CLIENT_HOME_PAGE_URL,
		failureRedirect: '/auth/login/failed',
	})
);

router.get('/logout', (req, res) => {
	req.logout();
	res.redirect(process.env.CLIENT_HOME_PAGE_URL);
});

module.exports = router;
