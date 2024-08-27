const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const mongoose = require('mongoose')

chai.use(chaiHttp);

suite('Functional Tests', function () {

  // Setup: Clean up the database before running tests
  before(async function () {
    await mongoose.connection.collections['stocks'].deleteMany({});
  });

  suite('/api/stock-prices', () => {

    test('Viewing one stock: GET request to /api/stock-prices/', async () => {
      const res = await chai.request(server)
        .keepOpen()
        .get('/api/stock-prices')
        .query({ stock: 'goog' })

      assert.equal(res.status, 200)
      assert.property(res.body, 'stockData')
      assert.property(res.body.stockData, 'stock')
      assert.property(res.body.stockData, 'price')
      assert.property(res.body.stockData, 'likes')
    })

    test('Viewing one stock and liking it: GET request to /api/stock-prices/', async () => {
      const res = await chai.request(server)
        .keepOpen()
        .get('/api/stock-prices')
        .query({ stock: 'goog', like: true })

      assert.equal(res.status, 200)
      assert.property(res.body, 'stockData')
      assert.property(res.body.stockData, 'stock')
      assert.property(res.body.stockData, 'price')
      assert.property(res.body.stockData, 'likes')
      assert.equal(res.body.stockData.likes, 1)
    })

    test('Viewing the same stock and liking it again: GET request to /api/stock-prices/', async () => {
      const res = await chai.request(server)
        .keepOpen()
        .get('/api/stock-prices')
        .query({ stock: 'goog', like: true })

      assert.equal(res.status, 200)
      assert.property(res.body, 'stockData')
      assert.property(res.body.stockData, 'stock')
      assert.property(res.body.stockData, 'price')
      assert.property(res.body.stockData, 'likes')
      assert.equal(res.body.stockData.likes, 1)

    })

    test('Viewing two stocks: GET request to /api/stock-prices/', async () => {
      const res = await chai.request(server)
        .keepOpen()
        .get('/api/stock-prices')
        .query({ stock: ['goog', 'msft'] })

      assert.equal(res.status, 200)

      // body has data
      assert.property(res.body, 'stockData')
      assert.isArray(res.body.stockData)

      // First stock
      assert.property(res.body.stockData[0], 'stock')
      assert.equal(res.body.stockData[0].stock, 'GOOG')
      assert.property(res.body.stockData[0], 'price')
      assert.property(res.body.stockData[0], 'rel_likes')

      // Second stock
      assert.property(res.body.stockData[1], 'stock')
      assert.equal(res.body.stockData[1].stock, 'MSFT')
      assert.property(res.body.stockData[1], 'price')
      assert.property(res.body.stockData[1], 'rel_likes')
    })

    test('Viewing two stocks and liking them: GET request to /api/stock-prices/', async () => {
      const res = await chai.request(server)
        .keepOpen()
        .get('/api/stock-prices')
        .query({ stock: ['goog', 'msft'], like: true })

      assert.equal(res.status, 200)

      // body has data
      assert.property(res.body, 'stockData')
      assert.isArray(res.body.stockData)
      
      // First stock
      assert.property(res.body.stockData[0], 'stock')
      assert.equal(res.body.stockData[0].stock, 'GOOG')
      assert.property(res.body.stockData[0], 'price')
      assert.property(res.body.stockData[0], 'rel_likes')
      assert.equal(res.body.stockData[0].rel_likes, 0)

      // Second stock
      assert.property(res.body.stockData[1], 'stock')
      assert.equal(res.body.stockData[1].stock, 'MSFT')
      assert.property(res.body.stockData[1], 'price')
      assert.property(res.body.stockData[1], 'rel_likes')
      assert.equal(res.body.stockData[1].rel_likes, 0)
    })
  })
});
