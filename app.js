require('dotenv').config();

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 27017;
const dbName = process.env.DB_NAME || 'project_to_inteview';
const dbUser = process.env.DB_USER;
const dbUserPassword = process.env.DB_PASSWORD;
const mongoUrl = `mongodb://${dbUser}:${dbUserPassword}@${dbHost}:${dbPort}/${dbName}`;

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
const path = require('path');

const whitelist = [
	'http://3.16.154.186:4000',
	'https://3.16.154.186:4000',
	'http://vietokok.buzz',
	'http://www.vietokok.buzz',
	'https://vietokok.buzz',
	'https://www.vietokok.buzz',
];

app.use(
	cors({
		origin: function (origin, callback) {
			if (whitelist.indexOf(origin) !== -1) {
				callback(null, true);
			} else {
				callback(new Error('Not allowed by CORS'));
			}
		},
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
		allowedHeaders: 'Authorization,Origin,X-Requested-With,Content-Type,Accept',
		credentials: true,
	})
);

app.use(express.static(path.join(__dirname, 'client')));

app.use(bodyParser.json());
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/post', authMiddleware, postRoutes);
app.use('/user', authMiddleware, userRoutes);
app.use('/notification', authMiddleware, notiRoutes);

app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname + '/client/index.html'));
});

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
	.connect(mongoUrl, {
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
