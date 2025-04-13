const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "placeholder");
const stripeTest = require("stripe")(process.env.STRIPE_TEST_KEY || "sk_test_placeholder");
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "noneyet";
const endpointSecretTest = process.env.STRIPE_TEST_WEBHOOK_SECRET || "noneyet";
const common = require("../common");
const paymentUtils = require("./paymentHandling");
const config = require("../config");
const discordUtils = require("../discord/discordUtils");
const discordOAuth = require("../discord/discordOAuth");

module.exports.paymentNotification = async(event) => {
    console.log(event);
    const body = JSON.parse(event.body);
    let result;
    const sig = event.headers["stripe-signature"];

    let checkSig;

    try {
        if (body.data.object.id && body.data.object.id.includes("cs_test")) {
            checkSig = stripeTest.webhooks.constructEvent(event.body, sig, endpointSecretTest);
        } else {
            checkSig = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
        }
    } catch (err) {
        await discordUtils.sendApiLogMessage("Stripe", `Failed to validate stripe signature for user payment: <@${event.body.data.object.client_reference_id}>`);
        return common.createResponse(400, `Webhook Error ${err.message}`);
    }

    console.log(checkSig);

    switch (checkSig.type) {
        case "checkout.session.completed": {
            const session = checkSig.data.object;
            //save order status to database
            result = await paymentUtils.createUser(session);
            if (result.statusCode !== 200) {
                return result;
            }
            console.info("Sucesfully created user record", result);

            //check if order is paid, and not awaiting funds
            if (session.payment_status === "paid") {
                result = await paymentUtils.paymentHandler(session);
                if (result.statusCode !== 200) {
                    return result;
                }
            }
        }
            break;

        case "checkout.session.async_payment_succeeded":{
            const session = checkSig.data.object;
            //fulfill purchase
            result = await paymentUtils.paymentHandler(session);
            if (result.statusCode !== 200) {
                return result;
            }
        }
            break;

        case "checkout.session.async_payment_failed":{
            const session = checkSig.data.object;
            //handle a failed transaction
            console.info("checkout session payment failed: ", session);
        }
            break;
    }
    return common.createResponse(200, `successfully handled event ${checkSig.data.object.id}`);
};

module.exports.stripeLink = async(event) => {
    console.log(event);
    const body = JSON.parse(event.body);
    const userInfo = await discordOAuth.getCredentials(body.token);
    if (userInfo === undefined) {
        return common.createResponse(400, "Bad Request");
    }
    console.log("Body: ", body);
    if (body.redirectUri && body.product && body.days && body.currency && body.instances) {
        const price = await this.getProductPrice(body.product, body.days, body.instances, body.currency);
        const sessionBody = {
            customer_email: userInfo.email,
            client_reference_id: userInfo.id,
            line_items: [
                {
                    price_data: {
                        currency: body.currency,
                        product_data: {
                            name: `${body.days} days of ${body.product}.`
                        },
                        unit_amount: price.amount
                    },
                    quantity: 1
                }
            ],
            mode: "payment",
            success_url: body.redirectUri,
            cancel_url: body.redirectUri
        };
        let session;
        if (body.redirectUri.includes("localhost:3000")) {
            session = await stripeTest.checkout.sessions.create(sessionBody);
        } else {
            session = await stripe.checkout.sessions.create(sessionBody);
        }
        console.log(session);
        if (session.url) {
            return common.createResponse(200, session.url);
        } else {
            return common.createResponse(404, "Failed to generate link");
        }
    } else if (body.redirectUri && body.product && body.days && body.currency) {
        const price = await this.getProductPrice(body.product, body.days, body.instances, body.currency);
        const sessionBody = {
            customer_email: userInfo.email,
            client_reference_id: userInfo.id,
            line_items: [
                {
                    price_data: {
                        currency: body.currency,
                        product_data: {
                            name: `${body.days} days of ${body.product}.`
                        },
                        unit_amount: price.amount
                    },
                    quantity: 1
                }
            ],
            mode: "payment",
            success_url: body.redirectUri,
            cancel_url: body.redirectUri
        };
        let session;
        if (body.redirectUri.includes("localhost:3000")) {
            session = await stripeTest.checkout.sessions.create(sessionBody);
        } else {
            session = await stripe.checkout.sessions.create(sessionBody);
        }
        console.log(session);
        if (session.url) {
            return common.createResponse(200, session.url);
        } else {
            return common.createResponse(404, "Failed to generate link");
        }
    }
};

module.exports.productInfo = async(event) => {
    const body = JSON.parse(event.body);
    console.log(body);
    if (body.product && body.days && body.currency && body.instances) {
        const price = await this.getProductPrice(body.product, body.days, body.instances, body.currency);
        return common.createResponse(200, price);
    }
    return common.createResponse(200, { euro: config.productsEURO, usd: config.productsUSD });
};

module.exports.getProductPrice = async(product, days, instances, currency) => {
    if (currency) {
        if (currency === "aud") {
            const price = config.productsAUD.find((data) => {
                if (product === "demo") {
                    if (data.product === product) {
                        if (data.duration === days) {
                            console.info("data matches query: ", data);
                            return data.amount;
                        }
                    }
                } else {
                    if (data.product === product) {
                        if (data.instances === instances) {
                            return data.amount;
                        }
                    }
                }
            });
            console.info("found price: ", price);
            return price;
        }
        if (currency === "usd") {
            // eslint-disable-next-line array-callback-return
            const price = config.productsUSD.find((data) => {
                if (product === "premium") {
                    if (data.product === product) {
                        if (data.duration === days) {
                            console.info("data matches query: ", data);
                            return data.amount;
                        }
                    }
                } else {
                    if (data.product === product) {
                        if (data.instances === instances) {
                            return data.amount;
                        }
                    }
                }
            });
            console.info("found price: ", price);
            return price;
        }
        if (currency === "eur") {
            // eslint-disable-next-line array-callback-return
            const price = config.productsEURO.find((data) => {
                if (product === "premium") {
                    if (data.product === product) {
                        if (data.duration === days) {
                            console.info("data matches query: ", data);
                            return data.amount;
                        }
                    }
                } else {
                    if (data.product === product) {
                        if (data.instances === instances) {
                            return data.amount;
                        }
                    }
                }
            });
            console.info("found price: ", price);
            return price;
        }
    }
    return 0;
};
