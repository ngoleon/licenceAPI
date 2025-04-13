const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");
const constants = require("../../constants");

// Create clients once per container reuse
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * @param {string} userId
 */
module.exports.getUserRecord = async(userId) => {
    try {
        const params = {
            TableName: constants.dynamodbName,
            Key: {
                userId: userId
            }
        };

        console.log(params);
        console.info("Getting user record", params);

        const data = await docClient.send(new GetCommand(params));
        console.info("Result of getter is:", data);

        return data;
    } catch (err) {
        console.error("Failed to getUserRecord:", err);
        return err;
    }
};
