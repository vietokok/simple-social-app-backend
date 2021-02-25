require('dotenv').config();
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user.model');
const Local = require('../models/local.model');
const HttpError = require('../models/http-error');

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
	const user = await User.findById(id);
	done(null, user);
});

// Local login

passport.use(
	'local',
	new LocalStrategy(
		{
			usernameField: 'email',
			passwordField: 'password',
			passReqToCallback: true,
		},
		async (req, email, password, done) => {
			let currentUser;
			try {
				currentUser = await Local.findOne({ email: email });
				// if (!currentUser) {
				// 	console.log('ok1');
				// 	return done(null, false);
				// }

				// if (!currentUser.validPassword(password)) {
				// 	console.log('ok2');
				// 	return done(null, false);
				// }
			} catch (error) {
				return done(error);
			}

			const user = await User.findById(currentUser.id);
			return done(null, user);
		}
	)
);

// Sử dụng FacebookStrategy cùng Passport.
passport.use(
	new FacebookStrategy(
		{
			clientID: process.env.FACEBOOK_KEY,
			clientSecret: process.env.FACEBOOK_SECRET,
			callbackURL: process.env.FACEBOOK_CALLBACK_URL,
			profileFields: ['id', 'displayName', 'email'],
		},
		async (accessToken, refreshToken, profile, done) => {
			let currentUser;
			try {
				currentUser = await User.findById(profile.id);
			} catch (error) {
				return done(error);
			}

			if (!currentUser) {
				let newUser = new User();
				newUser._id = profile.id;
				newUser.displayName = profile.displayName;
				newUser.email = profile._json.email;
				newUser.socket = {
					socketId: '',
					isOnline: false,
				};
				try {
					await newUser.save();
				} catch (err) {
					const error = new HttpError('Login failed, please try again.', 500);
					return next(error);
				}
				return done(null, newUser);
			}
			done(null, currentUser);
		}
	)
);

// Sử dụng GoogleStrategy cùng Passport.
passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_KEY,
			clientSecret: process.env.GOOGLE_SECRET,
			callbackURL: process.env.GOOGLE_CALLBACK_URL,
		},
		async (accessToken, refreshToken, profile, done) => {
			let currentUser;
			try {
				currentUser = await User.findById(profile.id);
			} catch (error) {
				return done(error);
			}

			if (!currentUser) {
				let newUser = new User();
				newUser._id = profile.id;
				newUser.displayName = profile.displayName;
				newUser.email = profile._json.email;
				newUser.socket = {
					socketId: '',
					isOnline: false,
				};
				try {
					await newUser.save();
				} catch (err) {
					// const error = new HttpError('Login failed, please try again.', 500);
					// return next(error);
					console.log(err);
				}
				return done(null, newUser);
			}
			done(null, currentUser);
		}
	)
);

module.exports = passport;
