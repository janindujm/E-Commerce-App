//Import the required AWS SDK modules to interact with SES
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');


//Initialize the AWS SES client with the specified region
const sesClient = new SESClient({
    region: 'us-east-2', //Specify the AWS region where your SES is configured
});

//Lambda function to send an email using AWS SES
exports.sendOrderEmail = async (toEmail, orderId, productName, quantity) => {
   
        const emailPars = {
            Source: 'janindujm@gmail.com',
            Destination: {
                ToAddresses: [toEmail], //Recipient's email address
            },
            Message:{
                Subject: {
                    Data: 'Order Confirmation', //Email subject
                },
                Body: {
                    Text: {
                        Data: `Your order with ID ${orderId} for ${quantity} units of ${productName} has been successfully placed.`, //Email body
                    },
                },
            },
        };

        try {
            //Create the send command and execute
            const sendCommand = new SendEmailCommand(emailPars);
            await sesClient.send(sendCommand);
            
        } catch (error) {
            throw new Error(`Failed to send email: ${error.message}`);
            
        }
};
    
        

        
