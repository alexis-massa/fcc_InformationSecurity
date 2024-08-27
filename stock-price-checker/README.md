# 💻 Project : Stock Price Checker
Build a full stack JavaScript app that is functionally similar to this: https://stock-price-checker.freecodecamp.rocks/.

## Instructions
- 1 Set the `NODE_ENV` environment variable to `test`, without quotes
- 2 Complete the project in `routes/api.js` or by creating a handler/controller
- 3 You will add any security features to `server.js`
- 4 You will create all of the functional tests in `tests/2_functional-tests.js`

## Tasks
Note Privacy Considerations: Due to the requirement that only 1 like per IP should be accepted, you will have to save IP addresses. It is important to remain compliant with data privacy laws such as the General Data Protection Regulation. One option is to get permission to save the user's data, but it is much simpler to anonymize it. For this challenge, remember to anonymize IP addresses before saving them to the database. If you need ideas on how to do this, you may choose to hash the data, truncate it, or set part of the IP address to 0.

Write the following tests in `tests/2_functional-tests.js`:

- [x] Viewing one stock: `GET` request to `/api/stock-prices/`
- [x] Viewing one stock and liking it: `GET` request to `/api/stock-prices/`
- [x] Viewing the same stock and liking it again: `GET` request to `/api/stock-prices/`
- [x] Viewing two stocks: `GET` request to `/api/stock-prices/`
- [x] Viewing two stocks and liking them: `GET` request to `/api/stock-prices/`

