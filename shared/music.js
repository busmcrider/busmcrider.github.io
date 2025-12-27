// music.js - Centralized album configuration

const albumConfigs = [
  {
    title: "Stars+Dust",
    artist: "Bus McRider",
    background: "Stars+Dust.jpeg",
    tracks: [
      { title: "Sippin' on Gin", src: "audio/A1 - Sippin' on Gin.mp3" },
      { title: "Captain Save a Hoe", src: "audio/A2 - Captain Save a Hoe.mp3" },
      { title: "Bad Guy", src: "audio/A3 - Bad Guy.mp3" },
      { title: "Master of Strings", src: "audio/A4 - Master of Strings.mp3" },
      { title: "King Kunta", src: "audio/A5 - King Kunta.mp3" },
      { title: "Outlaw's Paradise", src: "audio/A6 - Outlaw's Paradise.mp3" },
      { title: "Regulate", src: "audio/A7 - Regulate.mp3" },
      { title: "Big Iron", src: "audio/B1 - Big Iron.mp3" },
      { title: "Friends in Low Places", src: "audio/B2 - Friends in Low Places.mp3" },
      { title: "Ring of Fire (Slow)", src: "audio/B3 - Ring of Fire (Slow).mp3" },
      { title: "Ring of Fire", src: "audio/B4 - Ring of Fire.mp3" },
      { title: "A Horse with No Name", src: "audio/B5 - A Horse with No Name.mp3" },
      { title: "Walk The Line", src: "audio/B6 - Walk The Line.mp3" },
      { title: "(Ghost)Riders", src: "audio/B7 - (Ghost)Riders.mp3" }
    ]
  },

  {
    title: "Real Fake Protest Songs",
    artist: "Bus McRider",
    background: "Real Fake Protest Songs.jpeg",
    tracks: [
      { title: "The People's Anthem", src: "audio/1 - The People's Anthem.mp3" },
      { title: "Recycling Is Fake", src: "audio/2 - Recycling Is Fake.mp3" },
      { title: "An Apple A Day", src: "audio/3 - An Apple A Day.mp3" },
      { title: "You Can’t Vote Your Way Out Of This", src: "audio/4 - You Can’t Vote Your Way Out Of This.mp3" },
      { title: "Everyone’s a Problem", src: "audio/5 - Everyone’s a Problem.mp3" },
      { title: "You Sure About That?", src: "audio/6 - You Sure About That.mp3" }
    ]
  },

  {
    title: "Gnosify",
    artist: "Bus McRider",
    background: "Gnosify.jpeg",
    tracks: [
      { title: "The Cosmic Groove Chronicles", src: "audio/1 - The Cosmic Groove Chronicles.mp3" },
      { title: "War of Troy", src: "audio/2 - War of Troy.mp3" },
      { title: "Shadows on the Wall", src: "audio/3 - Shadows on the Wall.mp3" },
      { title: "Cosmic Blueprints", src: "audio/4 - Cosmic Blueprints.mp3" },
      { title: "Enoch 2", src: "audio/5 - Enoch 2.mp3" },
      { title: "Trojan Odyssey", src: "audio/6 - Trojan Odyssey.mp3" },
      { title: "The Apocryphon Flow", src: "audio/7 - The Apocryphon Flow.mp3" },
    ]
  },

  {
    title: "Gnosify II",
    artist: "Bus McRider",
    background: "Gnosify II.jpeg",
    tracks: [
      { title: "Gilgamesh from the Soil", src: "audio/1 - Gilgamesh from the Soil.mp3" },
      { title: "Bronze Age Time Capsule", src: "audio/2 - Bronze Age Time Capsule.mp3" },
      { title: "Kurupted Odyssey", src: "audio/3 - Kurupted Odyssey.mp3" },
      { title: "Plows, Vines & Game Codes", src: "audio/4 - Plows, Vines & Game Codes.mp3" },
      { title: "Metamorphosis & Chronic Smoke", src: "audio/5 - Metamorphosis & Chronic Smoke.mp3" },
      { title: "Parallel Lives Cipher", src: "audio/6 - Parallel Lives Cipher.mp3" },
      { title: "Archon Autopsy", src: "audio/7 - Archon Autopsy.mp3" },
      { title: "Plows, Vines & Game Codes (Fast)", src: "audio/8 - Plows, Vines & Game Codes (Fast).mp3" }
    ]
  },

  {
    title: "Strong Baby!",
    artist: "Bus McRider",
    background: "Strong Baby!.jpeg",
    tracks: [
      { title: "Strong Baby!", src: "audio/1 - Strong Baby!.mp3" },
      { title: "Power Bouncing!", src: "audio/2 - Power Bouncing!.mp3" },
      { title: "Miss Never Naps!", src: "audio/3 - Miss Never Naps!.mp3" },
      { title: "Holy Bellies!", src: "audio/4 - Holy Bellies!.mp3" },
      { title: "The Squiggle Wiggle Giggle Jiggle!", src: "audio/5 - The Squiggle Wiggle Giggle Jiggle!.mp3" },
      { title: "Cat Battles!", src: "audio/6 - Cat Battles!.mp3" },
      { title: "Toenail Shuffle! (Demo)", src: "audio/7 - Toenail Shuffle! (Demo).mp3" },
      { title: "D'oh Say Can You See!", src: "audio/8 - D'oh Say Can You See!.mp3" },
      { title: "Feeling Destructo!", src: "audio/9 - Feeling Destructo!.mp3" },
      { title: "Holy Bellies! (Climax)", src: "audio/10 - Holy Bellies! (Climax).mp3" },
      { title: "The Squiggle Wiggle Giggle Jiggle! (Demo)", src: "audio/11 - The Squiggle Wiggle Giggle Jiggle! (Demo).mp3" },
      { title: "Cat Battles! (End Credits)", src: "audio/12 - Cat Battles! (End Credits).mp3" }
    ]
  },

  {
    title: "Chorus of Meows",
    artist: "Bus McRider",
    background: "Chorus of Meows.jpeg",
    tracks: [
      { title: "Pig Rat Cat!", src: "audio/1 - Pig Rat Cat!.mp3" },
      { title: "Cat Battles! The Cat Rangers", src: "audio/2 - Cat Battles! The Cat Rangers.mp3" },
      { title: "Chorus of Meows", src: "audio/3 - Chorus of Meows.mp3" },
      { title: "Mister Handsome!", src: "audio/4 - Mister Handsome!.mp3" },
      { title: "Cat Battles! The Cat Illuminati", src: "audio/5 - Cat Battles! The Cat Illuminati.mp3" }
    ]
  },

  {
    title: "Cat Battles!",
    artist: "Bus McRider",
    background: "Cat Battles!.jpeg",
    tracks: [
      { title: "Cat Battles!", src: "audio/1 - Cat Battles!.mp3" },
      { title: "The Cat Rangers", src: "audio/2 - Cat Battles! The Cat Rangers.mp3" },
      { title: "Cat Rangers vs. The Iron Paw", src: "audio/3 - Cat Battles! Cat Rangers vs. The Iron Paw.mp3" },
      { title: "The Cat Illuminati", src: "audio/4 - Cat Battles! The Cat Illuminati.mp3" },
      { title: "Cat Battles! (End Credits)", src: "audio/5 - Cat Battles! (End Credits).mp3" }
    ]
  },

  {
    title: "Girlz Rapp",
    artist: "CuriousCat",
    background: "Girlz Rapp.jpeg",
    tracks: [
      { title: "1999 (Bratty Mix)", src: "audio/1999 (Bratty Mix).mp3" },
      { title: "Flip It Like a Woman", src: "audio/Flip It Like a Woman.mp3" },
      { title: "Flip It Like a Woman (Fast)", src: "audio/Flip It Like a Woman (Fast).mp3" },
      { title: "You Don’t Impress Me", src: "audio/You Don’t Impress Me.mp3" },
      { title: "Before He Cheats", src: "audio/Before He Cheats.mp3" },
      { title: "Jolene in My Own Name", src: "audio/Jolene in My Own Name.mp3" }
    ]
  },

  {
    title: "2017 - Half Stringer",
    artist: "Charuda",
    background: "Half Stringer.jpg",
    tracks: [
      { title: "POOLSIDE 7.1", src: "audio/01 POOLSIDE 7.1.mp3" },
      { title: "92816 (ft. Symboria)", src: "audio/02 92816 (ft. Symboria).mp3" },
      { title: "2CA", src: "audio/03 2CA.mp3" },
      { title: "Virus (ft. Lewis Lancaster & Oscar Zambrano)", src: "audio/04 Virus (ft. Lewis Lancaster & Oscar Zambrano).mp3" },
      { title: "Fears", src: "audio/05 Fears.mp3" },
      { title: "Shiza (ft. Symboria)", src: "audio/06 Shiza (ft. Symboria).mp3" }
    ]
  },

  {
    title: "2016 - Test Subject",
    artist: "Charuda",
    background: "Test Subject.jpg",
    tracks: [
      { title: "Tough Cookie (ft. Lengii & Isaac Allen)", src: "audio/01 Tough Cookie (ft. Lengii & Isaac Allen).mp3" },
      { title: "Lush (ft. Lengii & Isaac Allen)", src: "audio/02 Lush (ft. Lengii & Isaac Allen).mp3" },
      { title: "My Brother's Journey (ft. Lengii & Isaac Allen)", src: "audio/03 My Brother's Journey (ft. Lengii & Isaac Allen).mp3" },
      { title: "MAINT. OP.", src: "audio/04 MAINT. OP..mp3" },
      { title: "Saffron (ft. Lengii)", src: "audio/05 Saffron (ft. Lengii).mp3" },
      { title: "No Problem (ft. Isaac Allen)", src: "audio/06 No Problem (ft. Isaac Allen).mp3" }
    ]
  },

  {
    title: "2015 - Apt. 5",
    artist: "Charuda",
    background: "Apt. 5.jpg",
    tracks: [
      { title: "Off World (ft. Isaac Allen)", src: "audio/01 Off World (ft. Isaac Allen) 1.mp3" },
      { title: "Ass 2", src: "audio/02 Ass 2.mp3" },
      { title: "Nocturnal", src: "audio/03 Nocturnal.mp3" },
      { title: "Going Nowhere", src: "audio/04 Going Nowhere.mp3" },
      { title: "David Duchovny Cries Reading The New X-Files Script", src: "audio/05 David Duchovny Cries Reading The New X-Files Script.mp3" },
      { title: "Palace With No End", src: "audio/06 Palace With No End.mp3" }
    ]
  },

  {
    title: "2014 - Saline",
    artist: "Charuda",
    background: "Saline.jpg",
    tracks: [
      { title: "Suggestion", src: "audio/01 Suggestion 1.mp3" },
      { title: "Riverstones (ft. Isaac Allen)", src: "audio/02 Riverstones (ft. Isaac Allen).mp3" },
      { title: "Primal", src: "audio/03 Primal.mp3" },
      { title: "Reeses Pieces", src: "audio/04 Reeses Pieces.mp3" },
      { title: "A Year Earlier", src: "audio/05 A Year Earlier.mp3" },
      { title: "240_alter", src: "audio/06 240_alter.mp3" }
    ]
  },

  {
    title: "2013 - Trip In Progress",
    artist: "Charuda",
    background: "Trip In Progress.jpg",
    tracks: [
      { title: "I Don't Know (ft. Eskae)", src: "audio/01 I Don't Know (ft. Eskae).mp3" },
      { title: "Brackets", src: "audio/02 Brackets 1.mp3" },
      { title: "Glimpse", src: "audio/03 Glimpse.mp3" },
      { title: "Afterthought (ft. Isaac Allen)", src: "audio/04 Afterthought (ft. Isaac Allen).mp3" },
      { title: "Lionfish (ft. Isaac Allen)", src: "audio/05 Lionfish (ft. Isaac Allen).mp3" },
      { title: "Reflection", src: "audio/06 Reflection.mp3" }
    ]
  }
];

// Extract album name from path (first segment after root)
const pathParts = window.location.pathname.split('/').filter(p => p);
const detectedAlbum = pathParts[0] ? decodeURIComponent(pathParts[0]) : '';

// Get the config for this album
const albumConfig = albumConfigs.find(album => album.title === detectedAlbum);

if (!albumConfig) {
  console.error("Album not found:", detectedAlbum);
  document.title = "Album Not Found";
} else {
  // Set page title
  document.title = albumConfig.title;

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setAlbumInfo);
  } else {
    setAlbumInfo();
  }

  function setFaviconHref(dataUrl) {
    let favicon = document.querySelector("link[rel*='icon']");
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = dataUrl;
  }

  function generateFavicon(imageUrl, cacheKey = null) {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 512, 512);

      const faviconUrl = canvas.toDataURL('image/jpeg', 1.0);

      setFaviconHref(faviconUrl);

      // Cache if key provided
      if (cacheKey) {
        try {
          sessionStorage.setItem(cacheKey, faviconUrl);
        } catch (e) {
          // Storage full or unavailable, ignore
        }
      }
    };

    img.onerror = function() {
      console.warn('Could not load image for favicon:', imageUrl);
    };

    img.src = imageUrl;
  }

  function setAlbumInfo() {
    // Set album header text
    const albumTitle = document.getElementById('album-title');
    const albumArtist = document.getElementById('album-artist');

    if (albumTitle) albumTitle.textContent = albumConfig.title;
    if (albumArtist) albumArtist.textContent = albumConfig.artist;

    // Set background image
    if (albumConfig.background) {
      document.body.style.backgroundImage = `url('${albumConfig.background}')`;

      // Generate favicon from background image (cached via sessionStorage)
      const cacheKey = `favicon_${albumConfig.title}`;
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          setFaviconHref(cached);
        } else {
          generateFavicon(albumConfig.background, cacheKey);
        }
      } catch (e) {
        // sessionStorage unavailable, generate without caching
        generateFavicon(albumConfig.background);
      }
    }
  }

  // Export tracks for player.js
  window.tracks = albumConfig.tracks.map(track => ({
    artwork: track.artwork || albumConfig.background,
    artist: track.artist || albumConfig.artist,
    title: track.title,
    src: track.src
  }));
}

// Export albums list for navigation
window.albums = albumConfigs.map(album => album.title);
