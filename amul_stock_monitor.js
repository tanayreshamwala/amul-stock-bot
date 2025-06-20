require("dotenv").config();
const axios = require("axios");

const PUSHBULLET_TOKEN = process.env.PUSHBULLET_TOKEN;
const PRODUCT_IDS = [
  "6707b9eaec74db003270ba80", // Arabica Coffee
  "63410e732677af79f687339b", // Protein Buttermilk
];

const AMUL_API_URL =
  "https://shop.amul.com/api/1/entity/ms.products?fields[name]=1&fields[brand]=1&fields[categories]=1&fields[collections]=1&fields[alias]=1&fields[sku]=1&fields[price]=1&fields[compare_price]=1&fields[original_price]=1&fields[images]=1&fields[metafields]=1&fields[discounts]=1&fields[catalog_only]=1&fields[is_catalog]=1&fields[seller]=1&fields[available]=1&fields[inventory_quantity]=1&fields[net_quantity]=1&fields[num_reviews]=1&fields[avg_rating]=1&fields[inventory_low_stock_quantity]=1&fields[inventory_allow_out_of_stock]=1&fields[default_variant]=1&fields[variants]=1&fields[lp_seller_ids]=1&filters[0][field]=categories&filters[0][value][0]=protein&filters[0][operator]=in&filters[0][original]=1&facets=true&facetgroup=default_category_facet&limit=24&total=1&start=0&cdc=1m&substore=66506000c8f2d6e221b9193a";

async function sendPushNotification(title, body) {
  try {
    const response = await axios.post(
      "https://api.pushbullet.com/v2/pushes",
      {
        type: "note",
        title,
        body,
      },
      {
        headers: {
          Authorization: `Bearer ${PUSHBULLET_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("📲 Notification sent:", title);
  } catch (error) {
    console.error("❌ Pushbullet error:", error.message);
  }
}

async function fetchAndCheckStock() {
  try {
    console.log("🔍 Checking stock at", new Date().toLocaleTimeString());

    const response = await axios.get(AMUL_API_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/json",
        Referer: "https://shop.amul.com/en/browse/protein",
        Origin: "https://shop.amul.com",
        Cookie:
          "jsessionid=s%3A2TkkTLZKlhj12Wpwfbn4zFyy.knKH%2BJn%2BEpjKPAl8FreuM3eKzKqmNdHev63QVlPJw8U; __cf_bm=M4uKuCg1f6fmvFtjWRo9_LJB55qWHEwMPoRJP9r410Y-1750411768-1.0.1.1-zTKKm7H0eCZ.u_e6RiifBoo7qwfwFE_zr3GJSLY_T3TfgTBFTgLR0wEq5TsEHZLTm72DLuDOZlM18Lv.GNvrCsh0c5GSL_.3xKczg6E.vWk; _ga=GA1.1.1046078225.1750411773; _ga_E69VZ8HPCN=GS2.1.s1750411772$o1$g1$t1750411795$j37$l0$h1481128512",
      },
    });

    const data = response.data?.data || [];

    console.log("✅ Successfully fetched product data");
    console.log("📦 Total products found:", data.length);

    if (data.length === 0) {
      console.warn("⚠️ API returned an empty product list.");
    }

    let found = false;

    for (const product of data) {
      // console.log(
      //   `🧾 Product: ${product.name} | ID: ${product._id} | Available: ${product.available}`
      // );

      if (PRODUCT_IDS.includes(product._id)) {
        if (product.available === 1) {
          console.log(`✅ IN STOCK: ${product.name}`);
          await sendPushNotification(
            "Amul Product In Stock!",
            `${product.name} is now available.`
          );
        } else {
          console.log(`❌ OUT OF STOCK: ${product.name}`);
        }
        found = true;
      }
    }

    if (!found) {
      console.log("📭 Tracked products not found in API data.");
    }
  } catch (err) {
    console.error("❌ Error checking stock:", err.message);
  }
}

// Run every 1 min
console.log("🔁 Amul Stock Bot is starting...\n");
fetchAndCheckStock();
setInterval(fetchAndCheckStock, 60 * 10000);
