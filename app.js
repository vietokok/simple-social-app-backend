require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { ExpressPeerServer } = require('peer');

const sockets = require('./config/socket.config');
const passport = require('./config/passport.config');

const authMiddleware = require('./middlewares/auth.middleware');

const authRoutes = require('./routes/auth.route');
const messageRoutes = require('./routes/message.route');
const postRoutes = require('./routes/post.route');
const userRoutes = require('./routes/user.route');
const HttpError = require('./models/http-error');

const app = express();
const server = require('http').Server(app);

app.use(
	cors({
		origin: ['http://localhost:3000'],
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
		allowedHeaders: 'Authorization,Origin,X-Requested-With,Content-Type,Accept',
		credentials: true,
	})
);

app.use(bodyParser.json());
app.use(cookieParser());

app.use(
	cookieSession({
		name: 'session',
		keys: [process.env.COOKIE_KEY],
		maxAge: 24 * 60 * 60 * 100,
	})
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/message', authMiddleware, messageRoutes);
app.use('/post', authMiddleware, postRoutes);
app.use('/user', authMiddleware, userRoutes);

app.use((req, res, next) => {
	const error = new HttpError('Could not find this route.', 404);
	throw error;
});

app.use((error, req, res, next) => {
	if (res.headersSent) {
		return next();
	}
	res.status(error.code || 500);
	res.json({ message: error.message || 'An unknown error occurred!' });
});

mongoose
	.connect(process.env.MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		server.listen(process.env.PORT || 4000);
		sockets.init(server);
	})
	.catch((err) => {
		console.log(err);
	});
