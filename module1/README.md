# module1

## Building process

### Step 1 - One big fat lambda

Build everything in on lambda function

```
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
```

Explain how complex is this function, is doing many things:

1. Saving the order in the database
2. Calling the payment API and updating the database
3. Calling the restaurant API to send an order and update the database
4. Handling error managment for the payment
5. Handling error managment for the restaurant ordering.

This lambda function is very hard to test and make sure that everything works, as there are so many moving parts.

### Step 2 - Using SQS to make the lambda functions simpler
