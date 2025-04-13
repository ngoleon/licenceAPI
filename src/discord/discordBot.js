/* eslint-disable no-await-in-loop */
const axios = require("axios");
const nacl = require("tweetnacl");
const constants = require("../constants");
const userGetters = require("../dynamo/userRecord/getters");
const userSetters = require("../dynamo/userRecord/setters");
const licenseSetters = require("../dynamo/licenseRecord/setters");
const licenseGetter = require("../dynamo/licenseRecord/getters");
const config = require("../config");

exports.handler = async (event, context) => {
    const body = JSON.parse(event.body);
    const responseUrl = `https://discord.com/api/v10/interactions/${body.id}/${body.token}/callback`;

    // Fastest possible ACK
    await axios.post(responseUrl, { "type": 5 }, {
        headers: {
            "Content-Type": "application/json",
            "Accept-Encoding": "*"
        }
    }).then(res => {
        console.info("ACK sent:", res.status, res.statusText);
    }).catch(err => {
        console.error("ACK failed:", err?.response?.data || err.message);
    });

    console.log("Incoming event:", event);

    const PUBLIC_KEY = constants.discordBotPublicKey;
    const signature = event.headers['x-signature-ed25519'];
    const timestamp = event.headers['x-signature-timestamp'];
    const strBody = event.body;

    const isVerified = nacl.sign.detached.verify(
        Buffer.from(timestamp + strBody),
        Buffer.from(signature, 'hex'),
        Buffer.from(PUBLIC_KEY, 'hex')
    );

    if (!isVerified) {
        return {
            statusCode: 401,
            body: JSON.stringify('invalid request signature'),
        };
    }

    // Handle interaction logic AFTER immediate ACK
    if (body.type === 1) {
        return {
            statusCode: 200,
            body: JSON.stringify({ type: 1 }),
        };
    }

    if (body.type === 2) {
        console.log(`Received command: ${body.data.name}`);
        console.log("Command options:", body.data.options);
        console.log(`Interaction ID: ${body.id}, Token: ${body.token}`);

        // Run heavy logic without blocking response
        switch (body.data.name) {
            case "fulfill-order":
            case "remove-instances":
                await fulfillOrder(body);
                return;
            case "keycheck":
            case "keycheck-admin":
                await keyCheck(body);
                return;
        }
    }

    if (body.type === 3) {
        console.log("Component data:", body.data);
        console.log("Custom ID:", body.data.custom_id);
        console.log(`Interaction ID: ${body.id}, Token: ${body.token}`);

        axios.post(responseUrl, {
            type: 6,
            data: { flags: 0o00000100 }
        }, {
            headers: {
                "Content-Type": "application/json",
                "Accept-Encoding": "*"
            }
        }).then(res => {
            console.info("Deferred response sent:", res.status, res.statusText);
        }).catch(err => {
            console.error("Component ACK failed:", err?.response?.data || err.message);
        });

        switch (body.data.custom_id) {
            case "plugin-select":
                common.pluginDescriptions(body);
                break;
        }
    }

    // Always return something fast to complete Lambda
    return {
        statusCode: 200,
        body: "ACK sent",
    };
};


async function fulfillOrder(event) {
    try {
        console.log(event);

        const options = event.data.options;
        console.log(options);
    
        const target = options.find(o => o.name === "target").value;
        const duration = options.find(o => o.name === "duration")?.value ?? 1;
        const product = options.find(o => o.name === "product").value;
        const instances = options.find(o => o.name === "instances").value;
        console.log(`userTarget ${target} for duration ${duration} and product ${product}`);
        console.log("checking if user exists in database ");
        const result = await userGetters.getUserRecord(target);
        console.log(result);
        console.log(event);
        let licenseKey;
    
        if (result.Item === undefined) {
            const input = {
                userId: target,
                email: `manual by ${event.member.user.username}`,
                paymentStatus: `paid via discord`
            };
            const inputResult = await userSetters.updateUserRecord(input);
            if (inputResult.Attributes.userId !== undefined) {
                console.log("succesfull created user entry");
            }
    
            console.log("no pre-existing license key found");
            let createInput;
            if (product === "premium") {
                createInput = {
                    period: duration
                };
            } else {
                createInput = {
                    period: 0
                };
            }
            const createResult = await licenseSetters.createLicenseKey(createInput);
            console.log(createResult);
    
            if (createResult.licenseKey !== undefined) {
                const input = {
                    userId: target,
                    licenseKey: createResult.licenseKey,
                    cryptoId: createResult.customerId,
                    email: `manual by ${event.member.user.username}`,
                    paymentStatus: `paid via discord`,
                    period: duration,
                    product: product,
                    instances: instances
                };
                licenseKey = createResult.licenseKey;
                const inputResult = await userSetters.updateUserRecord(input);
                console.log(inputResult);
            }
            result = await userGetters.getUserRecord(target);
        } 

        licenseKey = result.Item.licenseKey;
        const matchingProduct = config.productsAUD.find(o => o.product === product);
        const licenseInput = {
            product: matchingProduct.product,
            duration: duration,
            licenseKey: licenseKey,
            instances: instances,
            userId: target,
            roleId: matchingProduct.roleId
        };
        const licenseData = await licenseSetters.addProductLicense(licenseInput);
        console.info("License Data is: " + licenseData);
        if (licenseData === "FAILED TO ADD LICENSE PRODUCT") {
            const editResponseUrl = `https://discord.com/api/v10/webhooks/${event.application_id}/${event.token}`;
            const embed = [
                { title: "Order Details",
                    description: `FAILED - Too Many Active Instances <@${target}>!\n\nLicence Key: ||${licenseKey}||\nDuration: ${duration} Days\nProduct Type: ${product}`,
                    color: 8311585
                }
            ];
            const messageBody = {
                "embeds": embed
            };
            const editResponse = await axios.post(editResponseUrl, messageBody);
            console.log(editResponse);
            return;
        }
        

        const editResponseUrl = `https://discord.com/api/v10/webhooks/${event.application_id}/${event.token}`;
        const embed = [
            { title: "Order Details",
                description: `Successfully created order for <@${target}>!\n\nLicence Key: ||${licenseKey}||\nDuration: ${duration} Days\nProduct Type: ${product} Instances: ${instances}`,
                color: 8311585
            }
        ];
        const messageBody = {
            "embeds": embed
        };
        const editResponse = await axios.post(editResponseUrl, messageBody);
        console.log(editResponse);
    } catch (err){ 
        console.error("Error in fulfill:", err);
    }
   
}

async function keyCheck(event) {
    try { 
        console.log("Event:", event);

        const options = event.data.options || [];
        let target = options.find(o => o.name === "target")?.value || event.member.user.id;

        console.log(`keycheck for userTarget ${target}`);
        console.log("checking if user exists in database");

        let result;
        try {
            result = await userGetters.getUserRecord(target);
            console.log(result);
        } catch (err) {
            console.error("Error fetching user record:", err);
            return;
        }

        if (!result.Item) {
            console.log("user does not exist");
            const editResponseUrl = `https://discord.com/api/v10/webhooks/${event.application_id}/${event.token}`;
            const embed = [{
                title: "Key Check",
                description: `User <@${target}> does not exist!`,
                color: 8311585
            }];
            const messageBody = { embeds: embed };

            try {
                const editResponse = await axios.post(editResponseUrl, messageBody);
                console.log(editResponse.data);
            } catch (err) {
                console.error("Error sending response:", err);
            }

            return;
        }

        const licenseKey = result.Item.licenseKey;
        let licenseResult;

        try {
            licenseResult = await licenseGetter.getLicenseRecord(licenseKey);
            console.log(licenseResult);
        } catch (err) {
            console.error("Error fetching license record:", err);
            return;
        }

        const currentTime = Math.floor(Date.now() / 1000);
        let demoReturnString = "";

        if (!licenseResult.Item.demoExpiry) {
            demoReturnString = "\nNo active license";
        } else {
            for (let i = 0; i < licenseResult.Item.demoExpiry.length; i++) {
                const expiry = licenseResult.Item.demoExpiry[i].expiryTime;
                if (expiry > currentTime) {
                    const readable = await unixTimeConversion(expiry);
                    demoReturnString += `\nInstance ${i + 1}: ${readable}`;
                }
            }

            if (demoReturnString === "") {
                demoReturnString = "\nNo active license";
            }
        }

        const editResponseUrl = `https://discord.com/api/v10/webhooks/${event.application_id}/${event.token}`;
        const embed = [{
            title: "Key Check",
            description: `Successfully found key for <@${target}>!\n\nPremium Duration: ${demoReturnString}`,
            color: 8311585
        }];
        const messageBody = { embeds: embed };

        try {
            const editResponse = await axios.post(editResponseUrl, messageBody);
            console.log(editResponse.data);
        } catch (err) {
            console.error("Error sending keycheck response:", err);
        }
    } catch (err) { 
        console.error("Error in fulfill:", err);
    }
}

async function unixTimeConversion(time) {
    const currentTime = Math.floor(Date.now() / 1000);
    const difference = time - currentTime;

    const countDownSeconds = new Date();
    countDownSeconds.setSeconds(countDownSeconds.getSeconds() + difference);
    const now = new Date().getTime();
    const remainingSeconds = countDownSeconds - now;

    const days = Math.floor(remainingSeconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remainingSeconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remainingSeconds % (1000 * 60 * 60)) / (1000 * 60));
    let response = days + " days, " + hours + " hours, " + minutes + " minutes";

    if (remainingSeconds < 0) {
        response = "0 Days 0 Hours 0 Minutes";
    }

    return response;
}