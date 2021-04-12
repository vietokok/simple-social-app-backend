require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const sockets = require('./config/socket.config');
require('./config/passport.config');

const authMiddleware = require('./middlewares/auth.middleware');

const authRoutes = require('./routes/auth.route');
const postRoutes = require('./routes/post.route');
const userRoutes = require('./routes/user.route');
const notiRoutes = require('./routes/notification.route');
const HttpError = require('./models/http-error');

const app = express();
const server = require('http').Server(app);

app.use(
	cors({
		origin: [process.env.CLIENT_HOME_PAGE_URL],
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
		allowedHeaders: 'Authorization,Origin,X-Requested-With,Content-Type,Accept',
		credentials: true,
	})
);

app.use(bodyParser.json());
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/post', authMiddleware, postRoutes);
app.use('/user', authMiddleware, userRoutes);
app.use('/notification', authMiddleware, notiRoutes);

app.use(() => {
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
