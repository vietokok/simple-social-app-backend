const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
	_id: { type: String, required: true },
	from: { type: String, required: true, ref: 'User' },
	to: { type: String, required: true, ref: 'User' },
	room: { type: String, required: true },
	content: { type: String, required: true },
	isRead: { type: String, required: true },
	createdTime: { type: String, required: true },
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
