const crypto = require("crypto");

module.exports.createResponse = (statusCode, body) => {
    if (body !== undefined) {
        body = JSON.stringify(body);
    } else {
        body = "";
    }

    return {
        statusCode,
        body,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*",
            "content-type": "application/json"
        }
    };
};

module.exports.createResponse = (statusCode, body, base64) => {
    return {
        statusCode,
        body: base64 ? body : JSON.stringify(body),
        isBase64Encoded: base64,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*",
            "content-type": base64 ? "application/octet-stream" : "application/json"
        }
    };
};

module.exports.createSecureResponse = (statusCode, body, secret) => {
    console.info("Creating a secure response");
    const convertedSecret = Buffer.from(secret).toString("base64");
    console.log(convertedSecret);

    if (body !== undefined) {
        body = JSON.stringify(body);
    } else {
        body = "";
    }

    const signature = crypto
        .createHmac("sha256", convertedSecret)
        .update(body)
        .digest("hex");
    console.log(body);
    console.log(signature);

    return {
        statusCode,
        body,
        headers: {
            "Token": signature,
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*",
            "content-type": "application/json"
        }
    };
};
