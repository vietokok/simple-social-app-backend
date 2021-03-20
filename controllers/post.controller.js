const HttpError = require('../models/http-error');
const Post = require('../models/post.model');
const mongoose = require('mongoose');
const moment = require('moment');
const { validationResult } = require('express-validator');

const aws = require('aws-sdk');
aws.config.update({
	secretAccessKey: 'YqV9cvnhgzoMtTQYtXg7VMZ79ihbchoirf5vI35o',
	accessKeyId: 'AKIAIWVNO2DXJLOPILGQ',
	region: 'ap-southeast-1',
});

const s3 = new aws.S3();

const getAllPost = async (req, res, next) => {
	let posts;
	try {
		posts = await Post.find({})
			.sort({ createdTime: '-1' })
			.populate('createdBy');
	} catch (err) {
		const error = new HttpError('Something went wrong, please try again.', 500);
		return next(error);
	}

	res.json({ posts: posts });
};

const getPostByUserId = async (req, res, next) => {
	const userId = req.userData.userId;

	let posts;
	try {
		posts = await Post.find({
			createdBy: userId,
		})
			.sort({ createdTime: '-1' })
			.populate('createdBy');
	} catch (err) {
		const error = new HttpError('Something went wrong, please try again.', 500);
		return next(error);
	}

	res.json({ posts: posts });
};

const getPostByFriendId = async (req, res, next) => {
	const friendId = req.params.friendId;

	let posts;
	try {
		posts = await Post.find(
			{
				createdBy: friendId,
			}
				.sort({ createdTime: '-1' })
				.populate('createdBy')
		);
	} catch (err) {
		const error = new HttpError('Something went wrong, please try again.', 500);
		return next(error);
	}

	res.json({ posts: posts });
};

const createPost = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return next(
			new HttpError('Invalid inputs passed, please check your data.', 422)
		);
	}

	const userId = req.userData.userId;
	const { content } = req.body;
	let image = {
		key: '',
		path: '',
	};
	if (req.file) {
		image.key = req.file.key;
		image.path = req.file.location;
	}

	const post = new Post({
		_id: mongoose.Types.ObjectId().toString(),
		content,
		image,
		like: [],
		comment: [],
		createdBy: userId,
		createdTime: moment().format('DD-MM-YYYY HH:mm:ss'),
	});

	let newPost;
	try {
		await post.save();
		newPost = await Post.populate(post, {
			path: 'createdBy',
			select: 'id displayName',
		});
	} catch (err) {
		const error = new HttpError('Creating post failed, please try again.', 500);
		return next(error);
	}
	res.status(201).json({ post: newPost.toObject({ getters: true }) });
};

const editPost = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return next(
			new HttpError('Invalid inputs passed, please check your data.', 422)
		);
	}

	const { content } = req.body;
	const postId = req.params.postId;
	const userId = req.userData.userId;

	let post;
	try {
		post = await Post.findById(postId).populate('createdBy', 'id displayName');
	} catch (err) {
		const error = new HttpError(
			'Something went wrong, could not update post',
			500
		);
		return next(error);
	}

	if (!post) {
		const error = new HttpError('Could not find post for this id', 204);
		return next(error);
	}

	if (post.createdBy.id !== userId) {
		const error = new HttpError('You are not allowed to edit this post', 401);
		return next(error);
	}
	post.content = content;

	try {
		await post.save();
	} catch (err) {
		const error = new HttpError(
			'Something went wrong, could not update post.',
			500
		);
		return next(error);
	}

	res.status(200).json({ post: post.toObject({ getters: true }) });
};

const deletePost = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userData.userId;

	let post;
	try {
		post = await Post.findById(postId);
	} catch (err) {
		const error = new HttpError(
			'Something went wrong, could not delete post',
			500
		);
		return next(error);
	}

	if (!post) {
		const error = new HttpError('Could not find post for this id', 204);
		return next(error);
	}

	if (post.createdBy !== userId) {
		const error = new HttpError(
			'You are not allowed to delete this post.',
			401
		);
		return next(error);
	}

	try {
		const params = { Bucket: 'testvietokok', Key: post.image.key };
		s3.deleteObject(params, function (err, data) {
			if (err) console.log(err, err.stack);
			else console.log('delete', data);
		});
		await post.remove();
	} catch (err) {
		const error = new HttpError(
			'Something went wrong, could not delete post',
			500
		);
		return next(error);
	}

	res.status(200).json({ message: { title: 'Deleted post.', id: postId } });
};

const likePost = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userData.userId;

	let post;
	try {
		post = await Post.findById(postId);
	} catch (err) {
		const error = new HttpError(
			'Something went wrong, could not like post',
			500
		);
		return next(error);
	}

	if (!post) {
		const error = new HttpError('Could not find post for this id', 204);
		return next(error);
	}
	const index = post.like.findIndex((post) => post === userId);
	let action = '';
	if (index !== -1) {
		action = 'like';
		post.like.push(userId);
	} else {
		action = 'unlike';
		post.like.splice(index, 1);
	}

	try {
		await post.save();
	} catch (err) {
		const error = new HttpError(
			'Something went wrong, could not update post.',
			500
		);
		return next(error);
	}
	res.status(200).json({ post: post.toObject({ getters: true }), action });
};

exports.getAllPost = getAllPost;
exports.getPostByUserId = getPostByUserId;
exports.getPostByFriendId = getPostByFriendId;
exports.deletePost = deletePost;
exports.editPost = editPost;
exports.createPost = createPost;
exports.likePost = likePost;
