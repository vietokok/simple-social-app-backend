const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const localSchema = new Schema({
	_id: { type: String, required: true },
	email: { type: String, required: true },
	password: { type: String, required: true },
});

localSchema.methods.generateHash = async (password) => {
	const salt = await bcrypt.genSalt(10);
	const hashPassword = await bcrypt.hash(password, salt);

	return hashPassword;
};
localSchema.methods.validPassword = async (password, hash) => {
	const check = await bcrypt.compare(password, hash);

	return check;
};

const Local = mongoose.model('Local', localSchema);

module.exports = Local;
