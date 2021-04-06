const dynamodbManager = require('./dynamodbManager');
const restaurantManager = require('./restaurantManager');

exports.handler = async (event) => {
  console.log('Order function');

  const orderId = event.payment.orderId;
  const orderDetails = event;

  if (await restaurantManager.order(orderDetails)) {
    await dynamodbManager.updateItem(orderId, 'ordered', 'true');
    console.log('end this thing')
    return {
      valid: true,
      orderId: orderId
    }
  } else {
    console.log('move to the failture function')
    return {
      valid: false,
      orderId: orderId
    }
  }
}