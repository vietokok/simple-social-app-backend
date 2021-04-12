const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
	_id: { type: String, required: true },
	userNotiSend: { type: String, required: true, ref: 'User' },
	userNotiRep: { type: String, required: true },
	notiType: { type: String, required: true },
	content: { type: String },
	post: { type: String, required: true },
	isSeen: { type: Boolean, required: true },
	createdTime: { type: String, required: true },
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
