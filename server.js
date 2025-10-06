require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch"); // node-fetch v2
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const CACHE_FILE = "cache.json";

app.use(cors());
app.use(express.static("public"));

// Funcție care face request la TikTok API
async function fetchTikTok() {
  const url =
    "https://tiktok-api23.p.rapidapi.com/api/user/posts?secUid=MS4wLjABAAAA0QEvq1XR5rsJDVx-s-wZhyfTiPjKoqP9bGTckOilBqvGZeijJKwW9oOABSYi-FGj&count=1&cursor=0";

  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      "x-rapidapi-host": "tiktok-api23.p.rapidapi.com",
    },
  };

  console.log("➡️ Trimit request real la TikTok API...");
  const res = await fetch(url, options);
  const data = await res.json();

  if (data.data && data.data.itemList && data.data.itemList.length > 0) {
    const latest = data.data.itemList[0];
    console.log("✅ Am primit video:", latest.id, "-", latest.desc);
    return { videoId: latest.id, desc: latest.desc, cachedAt: new Date() };
  }
  console.warn("⚠️ Nu am găsit videoclipuri în răspuns!");
  return null;
}

// Endpoint API pentru frontend
app.get("/api/tiktok/latest", async (req, res) => {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
      console.log("📂 Cache găsit:", cache);

      if (cache.cachedAt) {
        const lastUpdate = new Date(cache.cachedAt);
        const hoursPassed = (Date.now() - lastUpdate) / (1000 * 60 * 60);
        console.log("⏰ Ultima actualizare:", lastUpdate, "→ Ore trecute:", hoursPassed);

        if (hoursPassed < 12) {
          console.log("📦 Servim din cache (fără request nou la TikTok)");
          return res.json(cache);
        } else {
          console.log("⏳ Cache expirat, fac request nou...");
        }
      } else {
        console.warn("⚠️ Cache invalid, nu există `cachedAt`");
      }
    } else {
      console.log("ℹ️ Nu există cache.json, fac request nou...");
    }

    // Facem request nou
    const latest = await fetchTikTok();
    if (latest) {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(latest, null, 2));
      console.log("💾 Cache actualizat în cache.json");
      return res.json(latest);
    } else {
      return res.status(404).json({ error: "No video found" });
    }
  } catch (err) {
    console.error("❌ Eroare în endpoint:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
