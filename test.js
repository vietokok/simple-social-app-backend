const bcrypt = require('bcrypt');

const test = async () => {
	const salt = await bcrypt.genSalt(10);
	const text = '123123asd';
	const hashPassword = await bcrypt.hash(text, salt);
	console.log(hashPassword);
};

test();
