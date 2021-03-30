const {v4 : uuidv4} = require('uuid')
const dynamodbManager = require('./dynamodbManager');
const paymentManager = require('./paymentManager');
const sqsManager = require('./sqsManager');

function sendResponse(statusCode, message) {
	const response = {
		statusCode: statusCode,
		body: JSON.stringify(message)
	};
	return response
}

exports.handler = async (event) => {
  const order = JSON.parse(event.body);
  
  order.id = uuidv4();
  order.payment = 'false';
  order.ordered = 'false';
  await dynamodbManager.saveItem(order);

  if (paymentManager.pay(order)) {
    await sqsManager.sendMessage(order.id);
    await dynamodbManager.updateItem(order.id, 'payment', 'true');
    return sendResponse(200, 'Order was sent to restaurant')
  
  } else {
    await dynamodbManager.updateItem(order.id, 'payment', 'error');
    return sendResponse(400, 'There was an error processing the payment for the order');
  }
}