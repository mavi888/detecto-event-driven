const AWS = require('aws-sdk');
const eventbridge = new AWS.EventBridge();

module.exports.order =  async orderDetails => {
    const requestData = orderDetails;
    const params = {
        Entries: [{
            Detail: JSON.stringify(requestData),
            DetailType: "RestaurantOrder",
            Source: "Detecto",
            EventBusName: process.env.RESTAURANT_EVENTBUS
        }]
    };

	console.log(params);
    return eventbridge
		.putEvents(params)
		.promise()
		.then(() => {
			return orderDetails.payment.orderId;
		});
};