require('dotenv').config();
const redis = require('redis');

const client = redis.createClient({
	host: process.env.REDIS_HOST,
	port: process.env.REDIS_PORT,
});

exports.client = client;
