const {v4 : uuidv4} = require('uuid')
const dynamodbManager = require('./dynamodbManager');
const paymentManager = require('./paymentManager');
const restaurantManager = require('./restaurantManager');

function sendResponse(statusCode, message) {
	const response = {
		statusCode: statusCode,
		body: JSON.stringify(message)
	};
	return response
}

exports.handler = async (event) => {
  // in the event.body we will get all the information about the order
  const order = JSON.parse(event.body);
  
  // Save the order in the database, handle payment and if it succesfull send the order to the restaurant
  order.id = uuidv4();
  order.payment = 'false';
  order.ordered = 'false';
  await dynamodbManager.saveItem(order);

  // Handle the payment
  if (paymentManager.pay(order)) {
    await dynamodbManager.updateItem(order.id, 'payment', 'true');

    if (restaurantManager.order(order)) {
      // send the order to the restaurant
      await dynamodbManager.updateItem(order.id, 'ordered', 'true');
      return sendResponse(200, 'Order completed');

    } else {
      await dynamodbManager.updateItem(order.id, 'ordered', 'error');
      paymentManager.widrawPayment(order)
      await dynamodbManager.updateItem(order.id, 'payment', 'widrawn');

      return sendResponse(400, 'There was an error processing the order');
    }

  } else {
    await dynamodbManager.updateItem(order.id, 'payment', 'error');
    return sendResponse(400, 'There was an error processing the payment for the order');
  }
}