


gsap.registerPlugin(ScrollTrigger);

window.addEventListener("load", () => {
  gsap.registerPlugin(ScrollTrigger);

  /* ─────────────── 🔹 VIDEO HANDLERS ─────────────── */
  async function loadTikTok() {
    try {
      const res = await fetch("https://dammgirls.onrender.com/:10000/api/tiktok/latest");
      const data = await res.json();

      if (data.embedHtml) {
        document.getElementById("tiktok-video").innerHTML = data.embedHtml;
        const script = document.createElement("script");
        script.src = "https://www.tiktok.com/embed.js";
        document.body.appendChild(script);
      }
    } catch (err) {
      console.error("Eroare TikTok:", err);
    }
  }

  async function loadYouTube() {
    try {
      const res = await fetch("https://dammgirls.onrender.com/:10000/api/youtube/latest");
      const data = await res.json();

      if (data.embedHtml)
        document.getElementById("youtube-video").innerHTML = data.embedHtml;
    } catch (err) {
      console.error("Eroare YouTube:", err);
    }
  }

  async function updateFollowers() {
    const endpoints = [
      { id: "tiktok-count", url: "/api/followers/tiktok" },
      { id: "youtube-count", url: "/api/followers/youtube" },
    ];

    for (const { id, url } of endpoints) {
      try {
        const res = await fetch(url);
        const data = await res.json();
        document.getElementById(id).innerText = data.followers.toLocaleString("ro-RO");
      } catch {
        document.getElementById(id).innerText = "Eroare 😞";
      }
    }
  }

  loadTikTok();
  loadYouTube();
  updateFollowers();

  /* ─────────────── 🔹 BANNER ANIMATIONS ─────────────── */
  gsap.from("#banner .logo", {
    y: -300,
    opacity: 0,
    duration: 1.5,
    ease: "bounce.out",
  });

  gsap.from("#banner .content h1", {
    x: -100,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
    delay: 0.5,
  });

  gsap.from("#banner p", {
    x: 100,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
    delay: 1,
  });

  /* ─────────────── 🔹 ABOUT SECTION ─────────────── */
  const mariaTl = gsap.timeline({
    scrollTrigger: {
      trigger: "#first",
      start: "top 80%",
      toggleActions: "play none none reverse",
    },
  });

  mariaTl
    .from("#first .title h1", { y: 50, opacity: 0, duration: 0.6, ease: "power3.out" })
    .from("#first .title .name", { x: -40, opacity: 0, duration: 0.6, ease: "power3.out" }, "-=0.3")
    .from("#first .left p.content", { y: 40, opacity: 0, duration: 0.8, ease: "power2.out" }, "-=0.4")
    .from("#first .cta", { scale: 0.8, opacity: 0, duration: 0.5, ease: "back.out(2)" }, "-=0.3")
    .from("#first .social-link", {
      opacity: 0,
      y: 20,
      duration: 0.4,
      stagger: 0.1,
      ease: "power1.out",
    }, "-=0.2")
    .from("#first #girl1", { x: 100, opacity: 0, scale: 0.9, duration: 0.8, ease: "power3.out" }, "-=0.6");

    const troubleTl = gsap.timeline({
      scrollTrigger: {
        trigger: "#troublemedia",
        start: "top 80%",
        toggleActions: "play none none reverse",
      },
    });
    
    // imaginea logo
    troubleTl.from("#troublemedia .inner img", {
      opacity: 0,
      y: -50,
      duration: 0.8,
      ease: "power3.out",
    });
    
    // titlul "Trouble Media" + X + subtitlu
    troubleTl.from("#troublemedia .header h1", {
      x: -50,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
    }, "-=0.3");
    
    troubleTl.from("#troublemedia .header img", {
      scale: 0.5,
      opacity: 0,
      duration: 0.4,
      ease: "back.out(2)",
    }, "-=0.3");
    
    troubleTl.from("#troublemedia .header p", {
      x: 50,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
    }, "-=0.4");
    
    // paragrafele descriptive
    troubleTl.from("#troublemedia .content p.content", {
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: "power2.out",
    }, "-=0.2");
    
    // butonul CTA
    troubleTl.from("#troublemedia .cta", {
      scale: 0.8,
      opacity: 0,
      duration: 0.5,
      ease: "back.out(2)",
    }, "-=0.3");


    const followersTl = gsap.timeline({
      scrollTrigger: {
        trigger: "#followers",
        start: "top 85%",
        toggleActions: "play none none reverse",
        onEnter: () => document.querySelectorAll("#followers .card").forEach(c => c.style.opacity = 1),
      },
    });
    
    // Titlul
    followersTl.from("#followers h1", {
      y: -50,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
    });
    
    // Cardurile
    followersTl.from("#followers .card", {
      opacity: 0,
      y: 40,
      scale: 0.9,
      duration: 0.6,
      stagger: 0.2,
      ease: "power2.out",
    }, "-=0.3");
  });
