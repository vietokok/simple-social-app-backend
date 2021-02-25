const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const HttpError = require('../models/http-error');
const Message = require('../models/message.model');
const mongoose = require('mongoose');
const moment = require('moment');
let sockets = {};

sockets.init = (server) => {
	const io = require('socket.io')(server, {
		cors: {
			origin: ['http://localhost:3000'],
			methods: ['GET', 'POST', 'OPTIONS'],
		},
	});
	io.use((socket, next) => {
		if (socket.handshake.query && socket.handshake.query.token) {
			jwt.verify(
				socket.handshake.query.token,
				process.env.SERCRET_KEY,
				async (err, decoded) => {
					if (err) {
						const error = new HttpError('Authencation error!', 403);
						return next(error);
					}
					const userId = decoded.userId;
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
				}
			);
		}
	}).on('connection', (socket) => {
		console.log(socket.id);
		socket.on('privateMessage', async (msg) => {
			let friend;
			try {
				friend = await User.findById(msg.to);
			} catch (error) {}
			let isRead;
			if (friend.socket.isOnline === true) {
				isRead = true;
			} else {
				isRead = false;
			}

			const message = new Message({
				_id: mongoose.Types.ObjectId().toString(),
				from: msg.from,
				to: friend._id,
				room: msg.from.toString() + friend._id.toString(),
				content: msg.message,
				isRead,
				createdTime: moment().format('DD-MM-YYYY HH:mm:ss'),
			});
			let newMessage;
			try {
				await message.save();
				newMessage = await Message.populate(message, { path: 'from' });
				socket.emit('privateMessageResponse', newMessage);
				if (friend.socket.isOnline === true) {
					io.to(friend.socket.socketId).emit(
						'privateMessageResponse',
						newMessage
					);
				}
			} catch (err) {
				console.log(err);
			}
		});

		socket.on('makeVideo', async (videoInfo) => {
			let friend;
			try {
				friend = await User.findById(videoInfo.to);
			} catch (error) {}
			io.to(friend.socket.socketId).emit('makeVideoResponse', videoInfo);
		});

		socket.on('disconnect', async () => {
			let user;
			try {
				user = await User.findOne({
					'socket.socketId': socket.id,
				});
			} catch (error) {}
			user.socket.socketId = '';
			user.socket.isOnline = false;
			try {
				await user.save();
			} catch (error) {}
		});
	});
};

module.exports = sockets;
