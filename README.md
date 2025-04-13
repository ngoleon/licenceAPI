# licenceAPI

# Plugin License API

A simplified backend service to manage plugin licensing and user product access.

## Features

- Generate time-limited license keys
- Assign product access to users (by license)
- Support for instance limits + expiry
- Easily extendable for Stripe, Discord, or any other webhook

## Routes

- `POST /license/create` → create new license key
- `POST /license/add-product` → assign time-limited product access
- `POST /license/update` → update custom fields

- Generally, all configuration of new products/etc is done in src/stripe/config.js
