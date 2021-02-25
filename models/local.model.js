const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const Schema = mongoose.Schema;

const localSchema = new Schema({
	_id: { type: String, required: true },
	email: { type: String, required: true },
	password: { type: String, required: true },
});

localSchema.methods.generateHash = (password) => {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
localSchema.methods.validPassword = (password) => {
	return bcrypt.compareSync(password, this.password);
};

const Local = mongoose.model('Local', localSchema);

module.exports = Local;
