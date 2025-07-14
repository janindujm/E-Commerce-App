exports.anotherGreet = async (event) => {
    try {
        //Parse the request body from JSON format to a javascript object
        //This is step is necessary because the body of an HTTP request is a string
        //String in JSON format
        //And we need to convert it into an object to work with if easily in javascript
        const body = JSON.parse(event.body);
        //extract the 'name' field from the parsed body
        //we expect the client to send a name field in the body , and we
        //need to access that field to personalze the greeting message.

        const name = body.name;

        //if the name field is missing , return a 400 Bad Request response
        if(!name){
            return {
                staatusCode: 400, //Bad request ,  indicating that the client missed a required field
                body:JSON.stringify({
                    msg: "Name field is required",//specific message explaning the issue
                })
            }
        };
        //if the name is provided ,  return a 200 OK response with a personalized greeting
        //since the name is available,

        return{
            statusCode:200, //Ok status, indicating the request was successful
            body: JSON.stringify({
                message: `Hello, ${name}! welcome to our service #2`, //personalized greeting message
            })
        };

    } catch (error) {
        //If any error coccurs during the process (e.g) invalid Json format
        // or other unexpected errors
        return {
            statusCode: 500, //Internal Server Error status, indicating something went wrong on the server
            body: JSON.stringify({
                msg: "An error occurred while processing your request", //generic error message
            })
        };
    }
}