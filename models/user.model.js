const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
	_id: { type: String, required: true },
	email: { type: String, required: true },
	displayName: { type: String, required: true },
	socket: {
		socketId: { type: String },
		isOnline: { type: Boolean, required: true },
	},
});

const User = mongoose.model('User', userSchema);

module.exports = User;
