const express = require('express');
const { check } = require('express-validator');

const postControllers = require('../controllers/post.controller');

const router = express.Router();

router.get('/all', postControllers.getAllPost);
router.get('/user', postControllers.getPostByUserId);
router.get('/:friendId', postControllers.getPostByFriendId);

router.post(
	'/create',
	[check('content').not().isEmpty()],
	postControllers.createPost
);

router.patch(
	'/:postId',
	[check('content').not().isEmpty()],
	postControllers.editPost
);

router.delete('/:postId', postControllers.deletePost);

module.exports = router;
