'use strict'

const fetch = require('node-fetch')
const Stock = require('../models/stock')


const getStock = async (stock) => {
  // Fetch stock from APi
  const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`
  const fetchResponse = await fetch(url)

  const { symbol, latestPrice } = await fetchResponse.json()

  // If data is missing : null
  if (!symbol || !latestPrice) return null

  return { stock: symbol, price: latestPrice, }
}

const getLikes = async (symbol, like, ip) => {
  let stock
  // Find stock in db
  stock = await Stock.findOne({ symbol })
  // If it doesnt exist, create it  
  if (!stock) stock = await new Stock({ symbol }).save()

  // If we don't want to like: count them
  if (like !== 'true') return stock.likes.length

  // else (we add a like)
  if (!stock.likes.includes(ip)) {
    stock = await Stock.findOneAndUpdate(
      { symbol },
      { $push: { likes: ip } },
      { new: true, useFindAndModify: false }
    )
  }

  // Return nb of likes
  return stock.likes.length
}


module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async (req, res) => {
      const { stock, like } = req.query
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress

      console.log(`Getting${like == 'true' ? ' and liking' : ''} stocks: ${stock} for ${ip}`);

      if (typeof stock === 'string') {
        // Find the stock
        const stockData = await getStock(stock)

        // No stock found : error
        if (!stockData) return res.json({ error: 'Stock not found' })

        // Fetch likes
        stockData.likes = await getLikes(stock, like, ip)

        return res.json({ stockData })
      }

      // If not a string : array : two stocks

      const stockData = [await getStock(stock[0]), await getStock(stock[1])]

      // If at least one stock not found : error
      if (typeof stockData[0] == 'undefined' || typeof stockData[1] == 'undefined')
        return res.json({ error: 'Stock not found' })

      // Get likes for each stock
      const likes = [await getLikes(stock[0], like, ip), await getLikes(stock[1], like, ip)]

      // Relative likes
      stockData[0].rel_likes = likes[0] - likes[1]
      stockData[1].rel_likes = likes[1] - likes[0]
      
      return res.json({ stockData })
    })

}
