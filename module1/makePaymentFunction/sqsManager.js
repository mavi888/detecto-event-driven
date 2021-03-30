'use strict';

const AWS = require('aws-sdk');
const sqs = new AWS.SQS();

const ORDERS_QUEUE_URL = process.env.ORDERS_QUEUE_URL;

module.exports.sendMessage = async message => {
	const params = {
        MessageBody: message,
        QueueUrl: ORDERS_QUEUE_URL
      }

    console.log(params);

    return sqs.sendMessage(params).promise();
};
