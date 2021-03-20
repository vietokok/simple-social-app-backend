const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
	_id: { type: String, required: true },
	content: { type: String, required: true },
	image: { key: { type: String }, path: { type: String } },
	like: [{ type: String, required: true, ref: 'User' }],
	comment: [
		{
			user: {
				type: String,
				required: true,
				ref: 'User',
			},
			content: { type: String, required: true },
			createdTime: { type: String, required: true },
		},
	],
	createdBy: { type: String, required: true, ref: 'User' },
	createdTime: { type: String, required: true },
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
