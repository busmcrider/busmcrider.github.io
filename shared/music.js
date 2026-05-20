// music.js - Centralized album configuration

const albumConfigs = [
  {
    title: "UDOR",
    artist: "NOTSATAN",
    background: "UDOR.jpg",
    tracks: [
      { title: "Cold Liquid", src: "audio/Cold Liquid.mp3" },
      { title: "Five Stars", src: "audio/Five Stars.mp3" },
      { title: "Back Alley Liquid", src: "audio/Back Alley Liquid.mp3" },
      { title: "Cold Test Signal", src: "audio/Cold Test Signal.mp3" },
      { title: "Night Signal", src: "audio/Night Signal.mp3" },
      { title: "Knight Bus Skank", src: "audio/Knight Bus Skank.mp3" },
      { title: "Split Rim Pressure", src: "audio/Split Rim Pressure.mp3" },
      { title: "Railyard Ghost", src: "audio/Railyard Ghost.mp3" },
      { title: "Back Alley Tapes", src: "audio/Back Alley Tapes.mp3" },
      { title: "Needlewire Riddim", src: "audio/Needlewire Riddim.mp3" }
    ]
  },

  {
    title: "Dead Mega Zebra",
    artist: "NOTSATAN",
    background: "Dead Mega Zebra.jpg",
    tracks: [
      { title: "Back Alley Echo", src: "audio/Back Alley Echo.mp3" },
      { title: "Night Bus Skank", src: "audio/Night Bus Skank.mp3" },
      { title: "Cut Through Fear", src: "audio/Cut Through Fear.mp3" },
      { title: "Split Wire", src: "audio/Split Wire.mp3" },
      { title: "Hot Test Signal", src: "audio/Hot Test Signal.mp3" },
      { title: "Cut Through Fog", src: "audio/Cut Through Fog.mp3" },
      { title: "Broken Cable", src: "audio/Broken Cable.mp3" },
      { title: "Murkline Shuffle", src: "audio/Murkline Shuffle.mp3" },
      { title: "Broken Glass Bass", src: "audio/Broken Glass Bass.mp3" },
      { title: "Split Wire II", src: "audio/Split Wire II.mp3" }
    ]
  },

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
    title: "26 Mafia",
    artist: "Bus McRider",
    background: "26mafia.jpg",
    tracks: [
      { title: "I Stepped In Something Gross", src: "audio/I Stepped In Something Gross.mp3" },
      { title: "Shop Local", src: "audio/Shop Local.mp3" },
      { title: "Damn I Need A Hug", src: "audio/Damn I Need A Hug.mp3" },
      { title: "Put Your Fucking Shopping Cart Back", src: "audio/Put Your Fucking Shopping Cart Back.mp3" },
      { title: "Bitch Learn To Merge", src: "audio/Bitch Learn To Merge.mp3" },
      { title: "Forgot About Corndogs", src: "audio/Forgot About Corndogs.mp3" }
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
      { title: "You Sure About That?", src: "audio/6 - You Sure About That.mp3" },
      { title: "Who Rules You?", src: "audio/7 - Who Rules You.mp3" },
      { title: "Your Town Sucks", src: "audio/8 - Your Town Sucks.mp3" }
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
      { title: "Metamorphosis", src: "audio/5 - Metamorphosis.mp3" },
      { title: "Parallel Doooms", src: "audio/6 - Parallel Doooms.mp3" },
      { title: "Hypostasis 3030", src: "audio/7 - Hypostasis 3030.mp3" },
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
      { title: "The Return of The Dog", src: "audio/5 - Cat Battles! The Return of The Dog.mp3" },
      { title: "Cat Battles! (End Credits)", src: "audio/6 - Cat Battles! (End Credits).mp3" }
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
    title: "Girlz Rapp II",
    artist: "CuriousCat",
    background: "Girlz Rapp II.jpeg",
    tracks: [
      { title: "Boots Still Made For Walkin'", src: "audio/1 - Boots Still Made For Walkin'.mp3" },
      { title: "No Diggity, No Love", src: "audio/2 - No Diggity, No Love.mp3" },
      { title: "Love Me For The Weekend", src: "audio/3 - Love Me For The Weekend.mp3" },
      { title: "Not Your Hollaback", src: "audio/4 - Not Your Hollaback.mp3" },
      { title: "Wishful Thinking", src: "audio/5 - Wishful Thinking.mp3" },
      { title: "The Impression That I Get (2026 Flip)", src: "audio/6 - The Impression That I Get (2026 Flip).mp3" }
    ]
  },

  {
    title: "Queenstown",
    artist: "Capletina",
    background: "Queenstown.jpeg",
    tracks: [
      { title: "Daughters of the Fire", src: "audio/Daughters of the Fire.mp3" },
      { title: "Pressure Pon Di Pulse", src: "audio/Pressure Pon Di Pulse.mp3" },
      { title: "Fire Inna Di Heart", src: "audio/Fire Inna Di Heart.mp3" },
      { title: "Love Me For The Weekend", src: "audio/Love Me For The Weekend (Capletina).mp3" },
      { title: "Fire in the Clinic", src: "audio/Fire in the Clinic.mp3" },
      { title: "Daughter of the Lion", src: "audio/Daughter of the Lion.mp3" },
      { title: "Blaze Up That Hill", src: "audio/Blaze Up That Hill.mp3" },
      { title: "Fire Pon Di Wayward One", src: "audio/Fire Pon Di Wayward One.mp3" }
    ]
  },

  {
    title: "Castaway",
    artist: "Bus McRider",
    background: "Castaway.jpeg",
    tracks: [
      { title: "Hatching the Plan", src: "audio/Hatching the Plan.mp3" },
      { title: "I Will Always Wag My Finger In Your Face", src: "audio/I Will Always Wag My Finger In Your Face.mp3" },
      { title: "That Wood Is Dry", src: "audio/That Wood Is Dry.mp3" },
      { title: "My Grandmother's Not Here For A Reason", src: "audio/My Grandmother's Not Here For A Reason.mp3" },
      { title: "This Is MY Rock", src: "audio/This Is MY Rock.mp3" },
      { title: "The Sugar Shack", src: "audio/The Sugar Shack.mp3" },
      { title: "Fishbach out of Water", src: "audio/Fishbach out of Water.mp3" },
      { title: "I've Gotta Find The Idol", src: "audio/I've Gotta Find The Idol.mp3" },
      { title: "Goat to the End", src: "audio/Goat to the End.mp3" },
      { title: "Redemption Island Lullaby", src: "audio/Redemption Island Lullaby.mp3" }
    ]
  },

  {
    title: "Neon Plaza",
    artist: "Bus McRider",
    background: "Neon Plaza.png",
    tracks: [
      { title: "Office (Stealth) - Surveillance Floor 47", src: "audio/1 - Surveillance Floor 47.mp3" },
      { title: "Office (Stealth) - Sterile Observation Deck", src: "audio/2 - Sterile Observation Deck.mp3" },
      { title: "Office (Skirmish) - Set the Stage", src: "audio/3 - Set the Stage.mp3" },
      { title: "Office (Skirmish) - Escape the Maze", src: "audio/4 - Escape the Maze.mp3" },
      { title: "Office (Combo) - Fluorescent Compliance, pt. I", src: "audio/5 - Fluorescent Compliance.mp3" },
      { title: "Office (Combo) - Fluorescent Compliance, pt. II", src: "audio/6 - Fluorescent Compliance 2.mp3" },
      { title: "Office (Boss) - Glass Spine Protocol", src: "audio/7 - Glass Spine Protocol.mp3" },
      { title: "Office (Boss) - Glass Floors, Red Eyes", src: "audio/8 - Glass Floors, Red Eyes.mp3" },
      { title: "Hotel (Stealth) - Silent Corridor, pt. I", src: "audio/1 - Silent Corridor.mp3" },
      { title: "Hotel (Stealth) - Silent Corridor, pt. II", src: "audio/2 - Silent Corridor 2.mp3" },
      { title: "Hotel (Skirmish) - Grid of Glass, pt. I", src: "audio/3 - Grid of Glass.mp3" },
      { title: "Hotel (Skirmish) - Grid of Glass, pt. II", src: "audio/4 - Grid of Glass 2.mp3" },
      { title: "Hotel (Combo) - Iron Eclipse", src: "audio/5 - Iron Eclipse.mp3" },
      { title: "Hotel (Combo) - Clockwork Animal", src: "audio/6 - Clockwork Animal.mp3" },
      { title: "Hotel (Boss) - Concrete Hostile Systems, pt. I", src: "audio/7 - Concrete Hostile Systems.mp3" },
      { title: "Hotel (Boss) - Concrete Hostile Systems, pt. II", src: "audio/8 - Concrete Hostile Systems 2.mp3" },
      { title: "Shopping Center (Stealth) - Escalator Loop 6A", src: "audio/1 - Escalator Loop 6A.mp3" },
      { title: "Shopping Center (Stealth) - Gray Corridor Systems, pt. I", src: "audio/2 - Gray Corridor Systems.mp3" },
      { title: "Shopping Center (Skirmish) - Gray Corridor Systems, pt. II", src: "audio/3 - Gray Corridor Systems 2.mp3" },
      { title: "Shopping Center (Skirmish) - Barricade Protocol", src: "audio/4 - Barricade Protocol.mp3" },
      { title: "Shopping Center (Combo) - Black Glass Slogan, pt. I", src: "audio/5 - Black Glass Slogan.mp3" },
      { title: "Shopping Center (Combo) - Black Glass Slogan, pt. II", src: "audio/6 - Black Glass Slogan 2.mp3" },
      { title: "Shopping Center (Boss) - Pressure Cycle", src: "audio/7 - Pressure Cycle.mp3" },
      { title: "Shopping Center (Boss) - Pressure Discipline", src: "audio/8 - Pressure Discipline.mp3" },
      { title: "Casino (Stealth) - Fixed Odds, pt. I", src: "audio/1 - Fixed Odds.mp3" },
      { title: "Casino (Stealth) - Fixed Odds, pt. II", src: "audio/2 - Fixed Odds 2.mp3" },
      { title: "Casino (Skirmish) - Fixed Odds, pt. III", src: "audio/3 - Fixed Odds 3.mp3" },
      { title: "Casino (Skirmish) - Fixed Odds, pt. IV", src: "audio/4 - Fixed Odds 4.mp3" },
      { title: "Casino (Combo) - System Exploit, pt. I", src: "audio/5 - System Exploit.mp3" },
      { title: "Casino (Combo) - System Exploit, pt. II", src: "audio/6 - System Exploit 2.mp3" },
      { title: "Casino (Boss) - House Advantage", src: "audio/7 - House Advantage.mp3" },
      { title: "Casino (Boss) - System Meltdown", src: "audio/8 - System Meltdown.mp3" }
    ]
  },

  {
    title: "Besides",
    artist: "Bus McRider",
    background: "Besides.jpeg",
    tracks: [
      { title: "Shadows in Satin", src: "audio/Shadows in Satin.mp3" },
      { title: "Strawberry Skies (Dry)", src: "audio/Strawberry Skies (Dry).mp3" },
      { title: "The Sleep Paw", src: "audio/The Sleep Paw.mp3" },
      { title: "Dawn Ride", src: "audio/Dawn Ride.mp3" },
      { title: "Santa Needs A Beer", src: "audio/Santa Needs A Beer.mp3" },
      { title: "That Wood Is Dry", src: "audio/That Wood Is Dry.mp3" },
      { title: "Cosmic Blueprince", src: "audio/Cosmic Blueprince.mp3" },
      { title: "Parallel Lives in the Projector Room", src: "audio/Parallel Lives in the Projector Room.mp3" },
      { title: "The Apocryphon Slow", src: "audio/The Apocryphon Slow.mp3" },
      { title: "Enoch 1", src: "audio/Enoch 1.mp3" },
      { title: "Bronze Age Time Capsule (Slow)", src: "audio/Bronze Age Time Capsule (Slow).mp3" },
      { title: "Shadows in Satine", src: "audio/Shadows in Satine.mp3" },
      { title: "Strawberry Skies", src: "audio/Strawberry Skies.mp3" },
      { title: "Different People (Alt Cut)", src: "audio/Different People (Alt Cut).mp3" },
      { title: "Silent Night in Blood Red", src: "audio/Silent Night in Blood Red.mp3" },
      { title: "Night Ride", src: "audio/Night Ride.mp3" },
      { title: "Fire in El Paso", src: "audio/Fire in El Paso.mp3" },
      { title: "All In One Place", src: "audio/All In One Place.mp3" }
    ]
  }
];

// Extract album name from path and optional track number from hash
// Track numbers in URL hash are 1-based for human friendliness
const pathParts = window.location.pathname.split('/').filter(p => p);
const detectedAlbum = pathParts[0] ? decodeURIComponent(pathParts[0]) : '';
window.currentAlbum = detectedAlbum;

// Get track number from hash (e.g., #7)
const hash = window.location.hash.replace('#', '');
const detectedTrackNumber = hash ? parseInt(hash, 10) : null;

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

  function setAppleTouchIcon(dataUrl) {
    let icon = document.querySelector("link[rel='apple-touch-icon']");
    if (!icon) {
      icon = document.createElement('link');
      icon.rel = 'apple-touch-icon';
      document.head.appendChild(icon);
    }
    icon.href = dataUrl;
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

    // Set favicon image
    if (albumConfig.background) {

      // Detect mobile for favicon strategy
      const isMobile = window.matchMedia('(max-width: 600px)').matches ||
                       window.matchMedia('(hover: none)').matches;

      if (isMobile) {
        // Mobile: generate PNG data URI for Chrome compatibility and home screen icons
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = function() {
          const canvas = document.createElement('canvas');
          canvas.width = 180;
          canvas.height = 180;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, 180, 180);

          const faviconUrl = canvas.toDataURL('image/png');

          // Set both regular favicon (for browser tabs) and apple-touch-icon (for home screen)
          setFaviconHref(faviconUrl);
          setAppleTouchIcon(faviconUrl);
        };

        img.onerror = function() {
          console.warn('Could not load image for mobile favicon:', albumConfig.background);
        };

        img.src = albumConfig.background;
      } else {
        // Desktop: generate high-quality favicon (cached via localStorage)
        const cacheKey = `favicon_${albumConfig.title}`;
        try {
          const cached = localStorage.getItem(cacheKey);
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
  }

  // Export tracks for player.js
  window.tracks = albumConfig.tracks.map(track => ({
    artwork: track.artwork || albumConfig.background,
    artist: track.artist || albumConfig.artist,
    title: track.title,
    src: track.src
  }));

// Export albums list for navigation
window.albums = albumConfigs.map(album => album.title);

// Export album info for navigation (track counts)
window.albumInfo = albumConfigs.map(album => ({
  title: album.title,
  trackCount: album.tracks.length
}));

// Export detected track index (convert from 1-based URL to 0-based index)
// URL "/Album/1" = index 0, "/Album/2" = index 1, etc.
window.initialTrackIndex = (detectedTrackNumber !== null &&
                            !isNaN(detectedTrackNumber) &&
                            albumConfig &&
                            detectedTrackNumber >= 1 &&
                            detectedTrackNumber <= albumConfig.tracks.length)
                            ? detectedTrackNumber - 1
                            : null;
}
