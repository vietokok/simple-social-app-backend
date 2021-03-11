const Message = require('../models/message.model');

const getMessageByFriend = async (userId, friendId, l) => {
	const skip = parseInt(l);
	let messages;
	try {
		messages = await Message.find(
			{
				room: [
					userId.toString() + friendId.toString(),
					friendId.toString() + userId.toString(),
				],
			},
			'-room'
		)
			.skip(skip)
			.limit(20)
			.sort('-createdTime')
			.populate('from', 'displayName')
			.populate('to', 'displayName');
	} catch (err) {}
	messages.reverse();
	return messages;
};

exports.getMessageByFriend = getMessageByFriend;
