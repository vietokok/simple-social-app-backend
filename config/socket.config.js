require('dotenv').config();
const mongoose = require('mongoose');
const moment = require('moment');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');
const User = require('../models/user.model');
const Message = require('../models/message.model');
const messageControllers = require('../controllers/message.controller');

let sockets = {};

sockets.init = (server) => {
	const io = require('socket.io')(server, {
		cors: {
			origin: process.env.CLIENT_HOME_PAGE_URL,
			methods: ['GET', 'POST'],
			allowedHeaders: [
				'Authorization,Origin,X-Requested-With,Content-Type,Accept',
			],
			credentials: true,
		},
	});

	io.use(async (socket, next) => {
		if (!socket.request.headers.cookie) {
			const error = new HttpError('Authentication failed!', 403);
			return next(error);
		}

		const cookieObject = cookie.parse(socket.request.headers.cookie);
		const token = cookieObject['access_token'];

		let decodedToken;
		try {
			decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SERCRET_KEY);
		} catch (err) {
			const error = new HttpError('Authentication failed!', 403);
			return next(error);
		}

		const userId = decodedToken.userId;
		let user;
		try {
			user = await User.findById(userId);
		} catch (err) {
			const error = new HttpError(
				'Something went wrong, please try again.',
				500
			);
			return next(error);
		}

		if (!user) {
			const error = new HttpError(
				'Could not find user for the provided id.',
				404
			);
			return next(error);
		}

		user.socket.socketId = socket.id;
		user.socket.isOnline = true;

		try {
			await user.save();
		} catch (err) {
			const error = new HttpError('Something went wrong', 500);
			return next(error);
		}

		next();
	}).on('connection', (socket) => {
		const cookieObject = cookie.parse(socket.request.headers.cookie);
		const userId = cookieObject['c_user'];

		socket.on('getMessages', async (msg) => {
			const messages = await messageControllers.getMessageByFriend(
				userId,
				msg.friend,
				msg.l
			);
			socket.emit('getMessagesResponse', messages, msg.st);
		});

		socket.on('getMessagesFirst', async (msg) => {
			const messages = await messageControllers.getMessageByFriend(
				userId,
				msg.friend,
				'0'
			);
			socket.emit('getMessagesFirstResponse', messages);
		});
		socket.on('privateMessage', async (msg) => {
			let friend;
			try {
				friend = await User.findById(msg.to);
			} catch (error) {
				socket.emit('error', 'Something went wrong, please try again');
				return;
			}

			if (!friend) {
				socket.emit('error', 'Something went wrong, please try again');
				return;
			}

			let isRead;
			if (friend.socket.isOnline === true) {
				isRead = true;
			} else {
				isRead = false;
			}

			const message = new Message({
				_id: mongoose.Types.ObjectId().toString(),
				from: userId,
				to: friend._id,
				room: userId + friend._id.toString(),
				content: msg.message,
				isRead,
				createdTime: moment().format('DD-MM-YYYY HH:mm:ss'),
			});

			let newMessage;
			try {
				await message.save();

				newMessage = await Message.populate(message, { path: 'from' });

				socket.emit('privateMessageResponseA', newMessage);
				if (friend.socket.isOnline === true) {
					io.to(friend.socket.socketId).emit('check', newMessage);
					io.to(friend.socket.socketId).emit(
						'privateMessageResponse',
						newMessage
					);
				}
			} catch (err) {
				socket.emit('error', 'Something went wrong, please try again');
				return;
			}
		});

		// socket.on('makeVideo', async (videoInfo) => {
		// 	let friend;
		// 	try {
		// 		friend = await User.findById(videoInfo.to);
		// 	} catch (error) {}
		// 	io.to(friend.socket.socketId).emit('makeVideoResponse', videoInfo);
		// });

		socket.on('disconnect', async () => {
			let user;
			try {
				user = await User.findOne({
					'socket.socketId': socket.id,
				});
			} catch (error) {
				socket.emit('error', 'Something went wrong, please try again');
				return;
			}

			user.socket.socketId = '';
			user.socket.isOnline = false;

			try {
				await user.save();
			} catch (error) {
				socket.emit('error', 'Something went wrong, please try again');
				return;
			}
		});
	});
};

module.exports = sockets;
