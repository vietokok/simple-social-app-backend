require('dotenv').config();
const mongoose = require('mongoose');
const moment = require('moment');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');
const User = require('../models/user.model');
const Message = require('../models/message.model');
const messageControllers = require('../controllers/message.controller');
const { client } = require('./redis.config');

let sockets = {};

const whitelist = [
	'http://3.16.154.186:4000',
	'https://3.16.154.186:4000',
	'http://vietokok.buzz',
	'http://www.vietokok.buzz',
	'https://vietokok.buzz',
	'https://www.vietokok.buzz',
];

sockets.init = (server) => {
	const io = require('socket.io')(server, {
		cors: {
			origin: function (origin, callback) {
				if (whitelist.indexOf(origin) !== -1) {
					callback(null, true);
				} else {
					callback(new Error('Not allowed by CORS'));
				}
			},
			methods: ['GET', 'POST'],
			allowedHeaders: [
				'Authorization,Origin,X-Requested-With,Content-Type,Accept',
			],
			credentials: true,
		},
	});

	io.use(async (socket, next) => {
		// User verification by cookie
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

		// get messages when user scroll up
		socket.on('getMessages', async (msg) => {
			const messages = await messageControllers.getMessageByFriend(
				userId,
				msg.friend,
				msg.l
			);
			socket.emit('getMessagesResponse', messages, msg.st);
		});

		// get message in first times message box show
		socket.on('getMessagesFirst', async (msg) => {
			const messages = await messageControllers.getMessageByFriend(
				userId,
				msg.friend,
				'0'
			);
			socket.emit('getMessagesFirstResponse', messages);

			// set isRead of user with this friend is 0
			client.exists(userId, (err, exist) => {
				if (exist === 1) {
					client.get(userId, (err, result) => {
						const parseValue = JSON.parse(result);
						parseValue[msg.friend] = 0;

						client.set(userId, JSON.stringify(parseValue));
					});
				}
			});
		});
		// send message to others
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

				const key = friend._id.toString();

				// set isRead of this friend ++1
				client.exists(key, (err, exist) => {
					if (exist === 0) {
						const objectValue = {
							[userId]: 1,
						};
						client.set(key, JSON.stringify(objectValue));
					} else {
						client.get(key, (err, result) => {
							const parseValue = JSON.parse(result);
							parseValue[userId] = parseValue[userId] + 1;

							client.set(key, JSON.stringify(parseValue));
						});
					}
				});
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

		// get isRead status of messages
		socket.on('getIsRead', () => {
			client.exists(userId, (err, exist) => {
				if (exist === 1) {
					client.get(userId, (err, result) => {
						socket.emit('getIsReadResponse', JSON.parse(result));
					});
				} else {
					socket.emit('getIsReadResponse', {});
				}
			});
		});

		// send notification to others when create new post, like or comment
		socket.on('notification', async (data) => {
			switch (data.type) {
				case 'create':
					let users;
					try {
						users = await User.find({
							_id: { $ne: userId },
						});
					} catch (err) {
						socket.emit('error', 'Something went wrong, please try again');
						return;
					}

					if (!users) {
						socket.emit('error', 'Something went wrong, please try again');
						return;
					}

					for (let i = 0; i < users.length; i++) {
						if (users[i].socket.isOnline === true) {
							io.to(users[i].socket.socketId).emit(
								'notificationResponse',
								'newNotification'
							);
						}
					}
					break;

				case 'interactive':
					const receiver = data.to;

					let user;

					try {
						user = await User.findById(receiver);
					} catch (err) {
						socket.emit('error', 'Something went wrong, please try again');
						return;
					}

					if (!user) {
						socket.emit('error', 'Something went wrong, please try again');
						return;
					}

					console.log(user);

					if (user.socket.isOnline === true) {
						console.log('ok');
						io.to(user.socket.socketId).emit(
							'notificationResponse',
							'newNotification'
						);
					}
					break;
			}
		});

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
