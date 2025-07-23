// Import UUID generator to create unique order IDs
const { v4: uuid } = require('uuid');

const {SFNClient, StartExecutionCommand} = require('@aws-sdk/client-sfn');

// Import axios for making HTTP requests
const axios = require('axios');

// Import SQS client to send messages to the SQS queue
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

// Create new SQS client instance with the specified region
const sqsClient = new SQSClient({
  region: 'us-east-2',
});

const sfnClient = new SFNClient({
  region: 'us-east-2', // Specify the AWS region where your Step Function is deployed
});

const {sendOrderEmail} = require('../services/sendEmail');

exports.placeOrder = async (event) => {
  try {
    // Log the full authorizer context for debugging
    console.log("Authorizer Context:", JSON.stringify(event.requestContext.authorizer, null, 2));

    // Safely extract claims (works for different authorizer formats)
    const claims =
      event.requestContext.authorizer?.jwt?.claims ||
      event.requestContext.authorizer?.claims;

    if (!claims) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized: No claims found" }),
      };
    }

    // Extract email or fallback to username
    const email = claims.email || claims['cognito:username'] || claims.name;
    if (!email) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized: Missing email/username claim" }),
      };
    }

    const { id, quantity } = JSON.parse(event.body);

    // Validate required fields
    if (!id || !quantity) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Fields are required" }),
      };
    }

    // Fetch approved products from external API
    const productResponse = await axios.get(
      `https://hsfu1fuwyd.execute-api.us-east-2.amazonaws.com/approve-products`
    );

    const approvedproducts = Array.isArray(productResponse.data.data?.Items)
      ? productResponse.data.data.Items
      : [];

    // Find product in the approved list
    const product = approvedproducts.find((p) => p.id?.S === id);

    if (!product) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Product not found' }),
      };
    }

    // Check stock availability
    const availableStock = parseInt(product.quantity?.N || "0");

    if (availableStock < quantity) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Insufficient stock available" }),
      };
    }

    const orderId = uuid();

    // Create order payload
    const orderPayload = {
      id: orderId,
      productId: id,
      quantity,
      email,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    // Send order to SQS
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: process.env.SQS_QUEUE_URL,
        MessageBody: JSON.stringify(orderPayload),
      })
    );

    //send order confirmation email
    await sendOrderEmail(
        email,
        orderId,
        product.productName?.S || "Unknown Product",
        quantity
    );

    //This will tell aws to start running your Step Function using the orderpayload
    const stepFunctionCommand = new StartExecutionCommand({
        stateMachineArn: process.env.STEP_FUNCTION_ARN, // Reference to the Step Function ARN
        input: JSON.stringify(orderPayload), // Pass the order payload as input to the Step Function
        });
    // Start the Step Function execution
    await sfnClient.send(stepFunctionCommand);

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Order placed successfully", orderId }),
    };
  } catch (error) {
    console.error("Error in placeOrder:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
