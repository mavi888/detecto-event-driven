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

Let's break down this fat lambda into 2 functions.
One function will be taking care of the payment.
And another function will be talking care of ordering in the restaurant.

Now you might be wondering --- so how we can connect 2 functions together.

There are many ways to do it.
We can just invoke one function from the other. This approach is not recommended. As we are tightly coupling this functions. And also the function that is calling the other function will get billed for the time it takes to complete the operation, plus the time that the other function takes to complete what ever it is doing.

There is another way.
We can use a queue in between the functions. This is the recommended approach.
By doing this we make sure that the 2 functions are not tightly coupled and both functions are independent one from the other.
The big issue here is that the operation becomes async, and now our customer now will recieve a message that the order was taken. It will need another endpoint to know the status of the order.
