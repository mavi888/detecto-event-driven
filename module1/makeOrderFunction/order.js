const dynamodbManager = require('./dynamodbManager');
const restaurantManager = require('./restaurantManager');
const paymentManager = require('./paymentManager');

exports.handler = async (event) => {
  
  const orderId = event.Records[0].body;

  if (restaurantManager.order(orderId)) {
    await dynamodbManager.updateItem(orderId, 'ordered', 'true');
  } else {

    await dynamodbManager.updateItem(orderId, 'ordered', 'error');
    paymentManager.widrawPayment(orderId)
    await dynamodbManager.updateItem(orderId, 'payment', 'widrawn');

  }
}