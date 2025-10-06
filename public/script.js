async function loadTikTok() {
  try {
    const res = await fetch("/api/tiktok/latest"); // 🔥 nu mai punem localhost:3000, rulează direct prin server
    const data = await res.json();

    if (data && data.videoId) {
      const embedHTML = `
        <blockquote class="tiktok-embed"
          cite="https://www.tiktok.com/@damm.girls13/video/${data.videoId}"
          data-video-id="${data.videoId}" style="max-width: 605px;min-width: 325px;">
          <section></section>
        </blockquote>
      `;
      document.getElementById("tiktok-video").innerHTML = embedHTML;

      const script = document.createElement("script");
      script.src = "https://www.tiktok.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
    } else {
      document.getElementById("tiktok-video").innerText =
        "Nu am găsit videoclip.";
    }
  } catch (err) {
    console.error("Eroare:", err);
    document.getElementById("tiktok-video").innerText =
      "Eroare la încărcare video.";
  }
}

loadTikTok();
