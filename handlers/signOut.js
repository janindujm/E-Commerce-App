const {CognitoIdentityProviderClient, GlobalSignOutCommand} = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({
    region: 'us-east-2', //Specify the AWS region where your Cognito User Pool is located
});

exports.signOut = async (event) => {
    // Extract the access token from the request headers
    const {accessToken} = JSON.parse(event.body);

    // Configure parameters for Cognito SignOut command
    const params = {
        AccessToken: accessToken, // Access token of the user to sign out
    };

    try {
        // Create the sign-out command
        const command = new GlobalSignOutCommand(params);
        // Execute the sign-out request
        await client.send(command);

        // Return client response with success message
        return {
            statusCode: 200, // HTTP status code for successful request
            body: JSON.stringify({
                message: "User signed out successfully", // Success message
            }),
        };
        
    } catch (error) {
        return {
            statusCode: 400, // HTTP status code for internal server error
            body: JSON.stringify({
                message: "Error signing out user", // Error message
                error: error.message, // Include the error message from the exception
            }),
        };
        
    }
}