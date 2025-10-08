require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch"); // versiunea 2.x
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const CACHE_FILE = "cache.json"; // doar pentru TikTok

app.use(cors());
app.use(express.static("public"));

/* ──────────────────────────────
   🔹 TikTok — cu cache (max 2/zi)
────────────────────────────── */
async function fetchTikTok() {
  try {
    console.log("🌐 Cerere către TikTok oEmbed API...");
    const res = await fetch("https://www.tiktok.com/oembed?url=https://www.tiktok.com/@damm.girls13");

    if (!res.ok) {
      console.warn(`⚠️ TikTok oEmbed a răspuns cu ${res.status}`);
      return null;
    }

    const data = await res.json();
    return {
      videoId: "oembed",
      desc: data.title || "DAMM Girls latest TikTok 💃",
      embedHtml: data.html,
      cachedAt: new Date(),
    };
  } catch (err) {
    console.error("❌ Eroare la TikTok oEmbed:", err);
    return null;
  }
}

app.get("/api/tiktok/latest", async (req, res) => {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
      const lastUpdate = new Date(cache.cachedAt);
      const hoursPassed = (Date.now() - lastUpdate) / (1000 * 60 * 60);

      console.log(`⏰ Ultima actualizare: ${cache.cachedAt} → Ore trecute: ${hoursPassed}`);
      if (hoursPassed < 12) {
        console.log("📦 Servim din cache");
        return res.json(cache);
      }
    }

    console.log("⏳ Cache expirat, fac request nou...");
    const latest = await fetchTikTok();

    if (latest) {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(latest, null, 2));
      return res.json(latest);
    } else {
      console.warn("⚠️ Nu s-a primit niciun video nou, servim cache-ul anterior (dacă există).");
      if (fs.existsSync(CACHE_FILE)) {
        const cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
        return res.json(cache);
      }
      return res.status(404).json({ error: "No video found" });
    }
  } catch (err) {
    console.error("❌ Eroare în endpoint:", err);
    res.status(500).json({ error: err.message });
  }
});


const CACHE_YT_FILE = "cache_youtube.json";

async function fetchYouTube() {
  try {
    const apiKey = process.env.YT_API_KEY;
    const channelId = "UCto3Dxb25AiWCgC_s6ckgTQ";

    let pageToken = "";
    let foundVideo = null;
    let checkedCount = 0;

    console.log("🔍 Căutăm videoclipuri de peste 90s...");

    while (!foundVideo) {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=50&type=video${pageToken ? `&pageToken=${pageToken}` : ""}`;
      const searchRes = await fetch(searchUrl);

      if (!searchRes.ok) {
        console.error(`❌ YouTube Search API a răspuns cu ${searchRes.status}`);
        return null;
      }

      let searchData;
      try {
        searchData = await searchRes.json();
      } catch {
        console.error("❌ Eroare: răspuns invalid (nu e JSON). Probabil quotaExceeded.");
        return null;
      }

      if (!searchData.items?.length) {
        console.warn("⚠️ Niciun video găsit în această pagină.");
        break;
      }

      const videoIds = searchData.items.map(v => v.id.videoId).filter(Boolean);
      if (videoIds.length === 0) break;

      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoIds.join(",")}&part=contentDetails,snippet`;
      const detailsRes = await fetch(detailsUrl);

      if (!detailsRes.ok) {
        console.error(`❌ YouTube Videos API a răspuns cu ${detailsRes.status}`);
        return null;
      }

      let detailsData;
      try {
        detailsData = await detailsRes.json();
      } catch {
        console.error("❌ Eroare: corp invalid la /videos. Probabil quotaExceeded.");
        return null;
      }

      const parseDuration = iso => {
        const match = iso.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
        const minutes = parseInt(match?.[1] || 0);
        const seconds = parseInt(match?.[2] || 0);
        return minutes * 60 + seconds;
      };

      for (const v of detailsData.items) {
        checkedCount++;
        const duration = parseDuration(v.contentDetails.duration);
        if (duration > 90) {
          foundVideo = v;
          console.log(`🎬 Video normal găsit: ${v.id} (${duration}s)`);
          break;
        }
      }

      if (!foundVideo && searchData.nextPageToken) {
        pageToken = searchData.nextPageToken;
        console.log(`➡️ Continuăm căutarea (verificate ${checkedCount} videoclipuri)...`);
      } else break;
    }

    if (!foundVideo) {
      console.warn("⚠️ Niciun video peste 90s nu a fost găsit.");
      return null;
    }

    return {
      videoId: foundVideo.id,
      title: foundVideo.snippet.title,
      embedHtml: `<iframe width="560" height="315" src="https://www.youtube.com/embed/${foundVideo.id}" frameborder="0" allowfullscreen></iframe>`,
      cachedAt: new Date(),
    };
  } catch (err) {
    console.error("❌ Eroare la YouTube API:", err);
    return null;
  }
}

app.get("/api/youtube/latest", async (req, res) => {
  try {
    let cache = null;

    // ✅ Încearcă să citești cache-ul, dar ignoră dacă e corupt
    if (fs.existsSync(CACHE_YT_FILE)) {
      try {
        const content = fs.readFileSync(CACHE_YT_FILE, "utf-8");
        if (content.trim()) {
          cache = JSON.parse(content);
        } else {
          console.warn("⚠️ Fișierul cache YouTube este gol — va fi recreat.");
        }
      } catch (err) {
        console.warn("⚠️ Cache YouTube corupt, va fi recreat:", err.message);
      }
    }

    // 🔍 Verifică dacă cache-ul este valid și recent (<12h)
    if (cache) {
      const lastUpdate = new Date(cache.cachedAt);
      const hoursPassed = (Date.now() - lastUpdate) / (1000 * 60 * 60);

      console.log(`⏰ Ultima actualizare YouTube: ${cache.cachedAt} → Ore trecute: ${hoursPassed.toFixed(2)}`);

      if (hoursPassed < 12 && cache.embedHtml) {
        console.log("📦 Servim din cache YouTube");
        return res.json(cache);
      }
    }

    // 🌍 Fetch nou de la YouTube
    console.log("🌍 Fetch direct YouTube...");
    const latest = await fetchYouTube();

    if (latest) {
      fs.writeFileSync(CACHE_YT_FILE, JSON.stringify(latest, null, 2));
      console.log("💾 Cache YouTube actualizat!");
      return res.json(latest);
    }

    // ⚠️ Dacă fetch-ul a eșuat, dar avem cache vechi
    if (cache) {
      console.warn("⚠️ API YouTube indisponibil — servim cache vechi.");
      return res.json(cache);
    }

    // ❌ Nici cache valid, nici fetch nou
    return res.status(404).json({ error: "No video found" });
  } catch (err) {
    console.error("❌ Eroare în endpoint YouTube:", err);
    res.status(500).json({ error: err.message });
  }
});


/* ────────────────────────────── */
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

async function getTikTokFollowers(username) {
  try {
    const profileUrl = `https://www.tiktok.com/@${username}`;

    const res = await fetch(profileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": "https://www.tiktok.com/",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (res.status === 403) throw new Error("TikTok 403 - acces blocat");

    const html = await res.text();

    const match = html.match(/"followerCount":(\d+)/);

    if (match) {
      const followers = parseInt(match[1]);
      console.log(`👥 TikTok Followers pentru ${username}: ${followers}`);
      return followers;
    } else {
      throw new Error("Nu s-a găsit followerCount în pagină");
    }
  } catch (err) {
    console.error("❌ Eroare TikTok:", err);
    return 0;
  }
}


app.get("/api/followers/tiktok", async (req, res) => {
  try {
    const followers = await getTikTokFollowers("damm.girls13");
    res.json({ platform: "TikTok", followers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────── 🎥 YouTube Subscribers ─────────────── */
async function getYouTubeSubscribers(channelId) {
  const key = process.env.YT_API_KEY;
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${key}`
  );
  const data = await res.json();
  return data?.items?.[0]?.statistics?.subscriberCount || 0;
}

app.get("/api/followers/youtube", async (req, res) => {
  try {
    const followers = await getYouTubeSubscribers("UCto3Dxb25AiWCgC_s6ckgTQ");
    res.json({ platform: "YouTube", followers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});