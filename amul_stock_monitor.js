require("dotenv").config();
const axios = require("axios");

const API_URL =
  "https://shop.amul.com/api/1/entity/ms.products?fields[name]=1&fields[brand]=1&fields[categories]=1&fields[collections]=1&fields[alias]=1&fields[sku]=1&fields[price]=1&fields[compare_price]=1&fields[original_price]=1&fields[images]=1&fields[metafields]=1&fields[discounts]=1&fields[catalog_only]=1&fields[is_catalog]=1&fields[seller]=1&fields[available]=1&fields[inventory_quantity]=1&fields[net_quantity]=1&fields[num_reviews]=1&fields[avg_rating]=1&fields[inventory_low_stock_quantity]=1&fields[inventory_allow_out_of_stock]=1&fields[default_variant]=1&fields[variants]=1&fields[lp_seller_ids]=1&filters[0][field]=categories&filters[0][value][0]=protein&filters[0][operator]=in&filters[0][original]=1&facets=true&facetgroup=default_category_facet&limit=24&total=1&start=0&cdc=1m&substore=66506000c8f2d6e221b9193a";

const PUSHBULLET_API_TOKEN = process.env.PUSHBULLET_API_TOKEN;

const trackedProducts = {
  "6707b9eaec74db003270ba80":
    "Amul Kool Protein Milkshake | Arabica Coffee, 180 mL | Pack of 8",
  "63410e732677af79f687339b":
    "Amul High Protein Buttermilk, 200 mL | Pack of 30",
};

async function sendPush(title, body) {
  try {
    await axios.post(
      "https://api.pushbullet.com/v2/pushes",
      {
        type: "note",
        title,
        body,
      },
      {
        headers: {
          "Access-Token": PUSHBULLET_API_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`📲 Pushbullet sent: ${title}`);
  } catch (err) {
    console.error("❌ Pushbullet error:", err.message);
  }
}

async function checkStock() {
  try {
    console.log("\n🔍 Checking stock at", new Date().toLocaleTimeString());

    const res = await axios.get(API_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
    });

    const products = res.data?.data || [];

    for (const product of products) {
      const name = trackedProducts[product._id];

      if (name) {
        if (product.available === 1) {
          console.log(`✅ IN STOCK: ${name}`);
          await sendPush("🛒 In Stock!", `${name} is now available!`);
        } else {
          console.log(`❌ OUT OF STOCK: ${name}`);
        }
      }
    }
  } catch (err) {
    console.error("🚫 Error fetching API:", err.message);
  }
}

console.log("🔁 Amul Stock Monitor Bot Started...");
checkStock(); // First run immediately
setInterval(checkStock, 60 * 1000); // Then run every 1 min
