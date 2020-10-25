const puppeteer = require('puppeteer')

const getProductStock = async (page, partialXPath) => {
  const stocks = []

  for (let i = 2; i <= 7; i++) {
    const [ el ] = await page.$x(`${ partialXPath }/div[4]/div[${ i }]/div/div[1]/p/a`)
    const txt = await el.getProperty('textContent')
    const storeName = await txt.jsonValue()

    const [ el2 ] = await page.$x(`${ partialXPath }/div[4]/div[${ i }]/div/div[2]/div/p/span`)
    const txt2 = await el2.getProperty('textContent')
    const stockCount = await txt2.jsonValue()

    stocks.push({ storeName, stockCount })
  }

  return stocks
}

const scrapeProducts = async (url) => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(url)

  // Total search results:
  // const [ el ] = await page.$x('//*[@id="search-results"]/div[1]/div[2]')
  // const txt = await el.getProperty('textContent')
  // const rawResultsLength = await txt.jsonValue()
  // const resultsLength = parseInt(rawResultsLength.trim().split(' ')[ 0 ])
  // console.log(2 * resultsLength)

  const items = {}

  // Scrape a list of products
  for (let i = 2; i <= 20; i = i + 2) {
    // Item Code
    const [ itemCodeElement ] = await page.$x(`//*[@id="product-list"]/div[${ i }]/div/div/div[1]/div/div[1]/a/small/span`)
    const txt = await itemCodeElement.getProperty('textContent')
    const rawItemCode = await txt.jsonValue()
    const startIndex = 33
    const endIndex = 43
    const itemCode = rawItemCode.slice(startIndex, endIndex)

    // Title
    const [ titleElement ] = await page.$x(`//*[@id="product-list"]/div[${ i }]/div/div/div[1]/div/div[2]/span[1]/a`)
    const txt2 = await titleElement.getProperty('textContent')
    const title = await txt2.jsonValue()

    // Price
    let priceElement = null
    const [ regularPriceElement ] = await page.$x(`//*[@id="product-list"]/div[${ i }]/div/div/div[1]/div/div[2]/span[2]/strong`)
    if (!regularPriceElement) {
      const [ specialPriceElement ] = await page.$x(`//*[@id="product-list"]/div[${ i }]/div/div/div[1]/div/div[2]/span[3]/strong`)
      priceElement = specialPriceElement
    } else {
      priceElement = regularPriceElement
    }
    const txt3 = await priceElement.getProperty('textContent')
    const price = await txt3.jsonValue()

    // Stocks
    const stocks = await getProductStock(page, `//*[@id="product-list"]/div[${ i - 1 }]`)

    items[ i ] = { itemCode, title, price, stocks }
  }

  // Display each product's info
  Object.entries(items).forEach(([ key, item ]) => {
    console.log(item.itemCode)
    console.log(item.title)
    console.log(item.price)
    let totalStocks = ''
    item.stocks.forEach(store => {
      if (store.stockCount !== '-') {
        totalStocks += `${ store.storeName }: ${ store.stockCount }, `
      }
    })
    totalStocks = totalStocks.slice(0, -2)
    console.log(totalStocks)
    console.log('\n===========================================================================================\n')
  })

  browser.close()
}

const category = 710
scrapeProducts(`https://www.canadacomputers.com/index.php?cPath=${ category }`)