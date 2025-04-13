const userGetter = require("../dynamo/userRecord/getters");
const licenseSetter = require("../dynamo/licenseRecord/setters");
const userSetter = require("../dynamo/userRecord/setters");
const discordUtils = require("../discord/discordUtils");
const config = require("../config");
const common = require("../common");

module.exports.paymentHandler = async(session) => {
    console.info("Entered payment handler ", session);
    const user = await userGetter.getUserRecord(session.client_reference_id);
    console.info("Found user? ", user);

    if (user.Item.licenseKey === undefined) {
        let result;
        let matchingProduct;
        // FIND A MATCHING PRODUCT OF THE SAME PRICE
        if (session.currency === "aud") {
            config.productsAUD.forEach(async(product) => {
                if (product.amount === session.amount_total) {
                    console.info("Creating a new key for product " + product.product + ", price: " + product.amount);
                    matchingProduct = product;
                }
            });
        } else if (session.currency === "eur") {
            config.productsEURO.forEach(async(product) => {
                if (product.amount === session.amount_total) {
                    console.info("Creating a new key for product " + product.product + ", price: " + product.amount);
                    matchingProduct = product;
                }
            });
        } else {
            config.productsUSD.forEach(async(product) => {
                if (product.amount === session.amount_total) {
                    console.info("Creating a new key for product " + product.product + ", price: " + product.amount);
                    matchingProduct = product;
                }
            });
        }
        result = await licenseSetter.createLicenseKey({ period: 0 });
        console.info("Create LicenseKey result: ", result);
        if (result.licenseKey !== undefined && matchingProduct !== undefined) {
            // ADD THE NEW USER TO THE USER DATABASE
            const input = {
                userId: session.client_reference_id,
                data: { email: session.customer_email,
                    paymentStatus: session.payment_status,
                    licenseKey: result.licenseKey,
                    cryptoId: result.customerId }
            };
            const userData = await userSetter.updateUserRecord(input);
            console.info("User Data is: ", userData);

            // ADD THE NEW USER NEW PRODUCT TO LICENSE DATABASE
            const licenseInput = {
                product: matchingProduct.product,
                duration: matchingProduct.duration,
                licenseKey: result.licenseKey,
                instances: matchingProduct.instances,
                userId: session.client_reference_id,
                roleId: matchingProduct.roleId
            };
            const licenseData = await licenseSetter.addProductLicense(licenseInput);
            console.info("License Data is: ", licenseData);
            if (licenseData) {
                console.info("Succesfully handled payment request ", licenseData);
                return common.createResponse(200, "Successfuly handled payment");
            } else {
                console.info("Failed handling payment request ", licenseData);
                return common.createResponse(400, "Failed to handle payment");
            }
        } else {
            // await discordUtils.sendApiLogMessage("Payment", `Failed to add product for new user <@${session.client_reference_id}>. Matching product? ${matchingProduct ? "found" : "not found"}. LicenseKey? ${result.licenseKey ? "created" : "not created"}`);
            return common.createResponse(400, "Failed to handle payment");
        }
    } else {
        let matchingProduct;
        // FIND A MATCHING PRODUCT OF THE SAME PRICE
        config.productsAUD.forEach(async(product) => {
            if (product.amount === session.amount_total) {
                console.info("extending key for product " + product.product + ", price: " + product.amount);
                matchingProduct = product;
            }
        });
        config.productsUSD.forEach(async(product) => {
            if (product.amount === session.amount_total) {
                console.info("extending key for product " + product.product + ", price: " + product.amount);
                matchingProduct = product;
            }
        });
        config.productsEURO.forEach(async(product) => {
            if (product.amount === session.amount_total) {
                console.info("extending key for product " + product.product + ", price: " + product.amount);
                matchingProduct = product;
            }
        });

        const input = {
            product: matchingProduct.product,
            duration: matchingProduct.duration,
            licenseKey: user.Item.licenseKey,
            instances: matchingProduct.instances,
            userId: session.client_reference_id,
            roleId: matchingProduct.roleId
        };
        const licenseData = await licenseSetter.addProductLicense(input);
        console.info("License Data is: ", licenseData);
        if (licenseData) {
            console.info("Succesfully handled payment request ", licenseData);
            return common.createResponse(200, "Successfuly handled payment");
        } else {
            console.info("Failed handling payment request ", licenseData);
            return common.createResponse(400, "Failed to handle payment");
        }
    }
};

module.exports.createUser = async(session) => {
    console.log("Creating user for order", session);
    /// 1
    console.log("checking if user exists in database ", session.client_reference_id);
    const result = await userGetter.getUserRecord(session.client_reference_id);
    console.log(result);

    /// 2
    if (result.Item === undefined) {
        const input = {
            userId: session.client_reference_id,
            data: { email: session.customer_email,
                paymentStatus: session.payment_status }
        };
        console.log("creating user record: ", input);
        const inputResult = await userSetter.updateUserRecord(input);
        console.log(inputResult);
        if (inputResult.Attributes.userId !== undefined) {
            return common.createResponse(200, "succesfully created user entry");
        }
        return common.createResponse(400, "failed to create user entry");
    }
    console.log("user exists");
    return common.createResponse(200, "user exists");
};
