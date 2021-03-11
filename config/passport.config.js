require('dotenv').config();
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;

const User = require('../models/user.model');
const Local = require('../models/local.model');
const HttpError = require('../models/http-error');

// LocalStratery with passport
passport.use(
	'local',
	new LocalStrategy(
		{
			usernameField: 'email',
			passwordField: 'password',
		},
		async (email, password, done) => {
			let user;

			try {
				user = await Local.findOne({ email: email });

				if (!user) {
					return done(null, false);
				}

				const checkPassword = await user.validPassword(password, user.password);
				if (!checkPassword) {
					return done(null, false);
				}

				return done(null, user.id);
			} catch (error) {
				return done(error);
			}
		}
	)
);

// FacebookStrategy with passport
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
					return done(err);
				}

				return done(null, newUser.id);
			}

			return done(null, currentUser.id);
		}
	)
);

// GoogleStrategy with passport
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
					return done(err);
				}

				return done(null, newUser.id);
			}

			return done(null, currentUser.id);
		}
	)
);

module.exports = passport;
