require('dotenv').config();
const express = require('express');
const { check } = require('express-validator');

const postControllers = require('../controllers/post.controller');

const router = express.Router();
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

aws.config.update({
	secretAccessKey: process.env.AWS_SECRET_KEY,
	accessKeyId: process.env.AWS_ACCESS_KEY,
	region: process.env.AWS_REGION,
});

const s3 = new aws.S3();

const upload = multer({
	storage: multerS3({
		s3: s3,
		acl: 'public-read',
		bucket: process.env.AWS_S3_BUCKET,
		key: function (req, file, cb) {
			cb(null, file.originalname + Date.now()); //use Date.now() for unique file keys
		},
	}),
});

router.get('/all', postControllers.getPosts);
router.get('/user', postControllers.getPostByUserId);
router.get('/:friendId', postControllers.getPostByFriendId);

router.post('/create', upload.single('image'), postControllers.createPost);

router.patch(
	'/:postId',
	[check('content').not().isEmpty()],
	postControllers.editPost
);

router.delete('/:postId', postControllers.deletePost);

router.post('/:postId/like', postControllers.likePost);

router.post('/:postId/comment', postControllers.commentPost);

module.exports = router;
