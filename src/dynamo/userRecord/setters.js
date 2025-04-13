const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const constants = require("../../constants");
const dynamodbUpdateExpression = require("dynamodb-update-expression");

// Create clients once per container reuse
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Updates the user record in DynamoDB using a dynamic update expression.
 *
 * @param {Object} params
 * @param {Object} params.data - The fields to update
 * @param {string} params.userId - Discord ID of the user
 * @returns {Promise<Object|Error>} The updated record or error
 */
module.exports.updateUserRecord = async(params) => {
    if (!params) return;

    console.log("Updating user record with params: ", params);

    const original = {
        username: params.userId // used just to generate a dummy expression; replace if needed
    };

    try {
        const buildExpression = await dynamodbUpdateExpression.getUpdateExpression(original, params.data);

        const updateParams = {
            TableName: constants.dynamodbName,
            Key: {
                userId: params.userId
            },
            ReturnValues: "ALL_NEW",
            UpdateExpression: buildExpression.UpdateExpression,
            ExpressionAttributeNames: buildExpression.ExpressionAttributeNames,
            ExpressionAttributeValues: buildExpression.ExpressionAttributeValues
        };

        console.log("update expression: ", updateParams);

        const updateOutput = await docClient.send(new UpdateCommand(updateParams));
        console.log("update output: ", updateOutput);

        return updateOutput;
    } catch (err) {
        console.error("Error in updateUserRecord:", err);
        return err;
    }
};
