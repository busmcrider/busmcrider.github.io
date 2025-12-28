const audio = document.getElementById("audio");
const playBtn = document.getElementById("play");
const playIcon = document.getElementById("play-icon");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");
const seek = document.getElementById("seek");
const playlistEl = document.getElementById("playlist");
const nowPlaying = document.getElementById("now-playing");
const autoplayBtn = document.getElementById("autoplay");
const loopBtn = document.getElementById("loop");

const playlistTitle = document.getElementById("playlist-title");
const playlistToggle = document.getElementById("playlist-toggle");
const playlistWrapper = document.querySelector(".playlist-wrapper");
const playlistChevron = document.getElementById("playlist-chevron");

const volumeSlider = document.getElementById("volume");
const downloadBtn = document.getElementById("download");

const trackTitleEl = document.getElementById("track-title");
const trackTimeEl = document.getElementById("track-time");

// Safety check: warn if tracks not defined anywhere
if (typeof tracks === 'undefined' || !Array.isArray(tracks) || tracks.length === 0) {
  console.error('❌ ERROR: No tracks array found!');
  document.body.innerHTML = `
    <div style="text-align:center;padding:40px;color:#eee;font-family:system-ui;">
      <h1>😞 Player Error</h1>
      <p>Could not load music!</p>
      <a href="/" style="color:#eee;text-decoration:underline;">← Go Home</a>
    </div>
  `;
  throw new Error('Tracks not loaded - stopping player initialization');
}

downloadBtn.onclick = () => {
  const link = document.createElement("a");
  link.href = audio.src;
  link.download = tracks[index].title + ".mp3";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Storage helpers
const storage = {
  get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      return value !== null ? value : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  }
};

// Restore saved volume
const savedVolume = storage.get('musicPlayerVolume');
if (savedVolume !== null) {
  const vol = parseFloat(savedVolume);
  if (!isNaN(vol) && vol >= 0 && vol <= 100) {
    audio.volume = vol / 100;
    volumeSlider.value = vol;
  } else {
    audio.volume = 1.0;
  }
} else {
  audio.volume = 1.0;
}

let lastVolume = audio.volume;

volumeSlider.oninput = () => {
  audio.volume = volumeSlider.value / 100;
  storage.set('musicPlayerVolume', volumeSlider.value);
};

let index = 0;
let autoplay = true;
let loopMode = 0; // 0 off, 1 track, 2 all

let shouldScroll = false;

// Store the base album title once (before track name is appended)
const albumBaseTitle = document.title;

// Preloading system for smoother playback transitions
const preloadAudio = {
  next: null,
  prev: null
};

function preloadTracks() {
  // Determine which tracks to preload based on current position and loop mode
  let nextIndex = null;
  let prevIndex = null;

  if (loopMode === 1) {
    // Loop one track: no preloading needed (same track replays)
    return;
  }

  // Calculate next track index
  if (index < tracks.length - 1) {
    nextIndex = index + 1;
  } else if (loopMode === 2) {
    nextIndex = 0; // Loop all: wrap to start
  }
  // else: end of album with no loop, don't preload (next would be different album)

  // Calculate previous track index
  if (index > 0) {
    prevIndex = index - 1;
  } else if (loopMode === 2) {
    prevIndex = tracks.length - 1; // Loop all: wrap to end
  }
  // else: start of album with no loop, don't preload (prev would be different album)

  // Preload next track
  if (nextIndex !== null) {
    if (!preloadAudio.next || preloadAudio.next.src !== tracks[nextIndex].src) {
      preloadAudio.next = new Audio();
      preloadAudio.next.preload = 'auto';
      preloadAudio.next.src = tracks[nextIndex].src;
    }
  } else {
    preloadAudio.next = null;
  }

  // Preload previous track
  if (prevIndex !== null) {
    if (!preloadAudio.prev || preloadAudio.prev.src !== tracks[prevIndex].src) {
      preloadAudio.prev = new Audio();
      preloadAudio.prev.preload = 'auto';
      preloadAudio.prev.src = tracks[prevIndex].src;
    }
  } else {
    preloadAudio.prev = null;
  }
}

tracks.forEach((t, i) => {
  const li = document.createElement("li");
  li.textContent = t.title;
  li.onclick = () => loadTrack(i, true);
  playlistEl.appendChild(li);
});

function scrollToActive() {
  const active = playlistEl.querySelector(".active");
  if (active) {
    active.scrollIntoView({
      block: "nearest"
    });
  }
}

function updateMediaSession() {
  if ('mediaSession' in navigator) {
    const track = tracks[index];

    const albumName = document.title || 'Album';

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist || 'Unknown Artist',
      album: track.album || albumName,
      artwork: [{
        src: track.artwork || 'cover.jpg',
        sizes: '512x512',
        type: 'image/jpeg'
      }]
    });

    navigator.mediaSession.setActionHandler('play', () => audio.play());
    navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => loadTrack((index - 1 + tracks.length) % tracks.length, true));
    navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
  }
}

function loadTrack(i, play=false) {
  index = i;
  audio.src = tracks[i].src;
  trackTitleEl.textContent = tracks[i].title;
  playlistTitle.textContent = tracks[i].title;

  [...playlistEl.children].forEach((li, n) =>
    li.classList.toggle("active", n === i)
  );

  // Update page title with track name
  document.title = `${albumBaseTitle} - ${tracks[i].title}`;

  scrollToActive();
  updateMediaSession();
  updateUrl();

  // Preload adjacent tracks for smoother transitions
  preloadTracks();

  // Enable scrolling for long titles
  trackTitleEl.classList.remove('long');
  trackTitleEl.style.setProperty('--scroll-distance', '0px');
  trackTitleEl.removeAttribute('data-title');

  requestAnimationFrame(() => {
      const textWidth = trackTitleEl.scrollWidth;
      const elementWidth = trackTitleEl.offsetWidth;
      const threshold = 3; // Allow 3px tolerance before scrolling

      if (textWidth > elementWidth + threshold) {
        shouldScroll = true;

        const scrollGap = 50;
        const scrollSpeed = 25;
        const minDuration = 8;
        const maxDuration = 30;

        const scrollDistance = -(textWidth + scrollGap);
        trackTitleEl.style.setProperty('--scroll-distance', `${scrollDistance}px`);

        // Calculate duration for consistent scroll speed
        const scrollTime = Math.abs(scrollDistance) / scrollSpeed;
        const totalDuration = scrollTime / 0.9; // 90% scrolling, 10% pause
        const duration = Math.max(minDuration, Math.min(maxDuration, totalDuration));
        trackTitleEl.style.setProperty('--scroll-duration', `${duration}s`);

        trackTitleEl.setAttribute('data-title', tracks[i].title);

        // Only add .long class if audio is currently playing
        if (!audio.paused) {
          trackTitleEl.classList.add('long');
        }
      } else {
        shouldScroll = false;
      }
    });

  if (play) audio.play();
}

function updateUrl() {
  const trackNumber = index + 1;

  if (window.history.replaceState) {
    // Pass just the hash - browser preserves origin and path automatically
    window.history.replaceState({}, document.title, `#${trackNumber}`);
  }
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function updatePlayIcon() {
  playIcon.innerHTML = audio.paused
    ? `<path d="M8 5v14l11-7z"/>`
    : `<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>`;
}

playBtn.onclick = () => {
  audio.paused ? audio.play() : audio.pause();
};

nextBtn.onclick = () => nextTrack();
prevBtn.onclick = () => prevTrack();

function nextTrack() {
  // When looping one track, restart current track
  if (loopMode === 1) {
    audio.currentTime = 0;
    audio.play();
    return;
  }

  if (index < tracks.length - 1) {
    loadTrack(index + 1, true);
  } else if (loopMode === 2) {
    loadTrack(0, true);
  } else if (loopMode === 0 && autoplay && currentIndex !== -1) {
    const nextIndex = (currentIndex + 1) % albums.length;
    window.location.href = `/${encodeURIComponent(albums[nextIndex])}/#1`;
  }
}

function prevTrack() {
  // When looping one track, restart current track
  if (loopMode === 1) {
    audio.currentTime = 0;
    audio.play();
    return;
  }

  if (index > 0) {
    loadTrack(index - 1, true);
  } else if (loopMode === 2) {
    loadTrack(tracks.length - 1, true);
  } else if (loopMode === 0 && autoplay && currentIndex !== -1) {
    const prevIndex = (currentIndex - 1 + albums.length) % albums.length;
    const prevAlbumInfo = window.albumInfo[prevIndex];
    if (prevAlbumInfo) {
      window.location.href = `/${encodeURIComponent(prevAlbumInfo.title)}/#${prevAlbumInfo.trackCount}`;
    }
  }
}

audio.onplay = () => {
  updatePlayIcon();
  scrollToActive();

  // Add scrolling animation if title is long
  if (shouldScroll) {
    trackTitleEl.classList.add('long');
  }
};

audio.onpause = () => {
  updatePlayIcon();

  // Remove scrolling animation when paused, show ellipsis instead
  trackTitleEl.classList.remove('long');
};

audio.onended = () => {
  if (loopMode === 1) {
    audio.play();
  } else if (autoplay) {
    nextTrack();
  }
};

audio.onloadedmetadata = () => seek.max = audio.duration;
audio.ontimeupdate = () => {
  seek.value = audio.currentTime;
  trackTimeEl.textContent = `${formatTime(audio.currentTime)}/${formatTime(audio.duration || 0)}`;
};
seek.oninput = () => audio.currentTime = seek.value;

autoplayBtn.onclick = () => {
  autoplay = !autoplay;
  autoplayBtn.textContent = autoplay ? "AUTO" : "OFF";
};

loopBtn.onclick = () => {
  loopMode = (loopMode + 1) % 3;
  loopBtn.textContent =
    loopMode === 0 ? "↻ OFF" :
    loopMode === 1 ? "↻ ONE" :
    "↻ ALL";
};

// Initialize shortcuts state - inverse of playlist
const shortcutsEl = document.querySelector('.shortcuts');

if (shortcutsEl && !playlistWrapper.classList.contains("collapsed")) {
  shortcutsEl.removeAttribute('open');
}

// Sync shortcuts toggle with playlist (maintain switch behavior)
if (shortcutsEl) {
  shortcutsEl.addEventListener('toggle', () => {
    const shortcutsOpen = shortcutsEl.hasAttribute('open');
    const playlistCollapsed = playlistWrapper.classList.contains('collapsed');

    // Maintain switch: if shortcuts opened, close playlist
    if (shortcutsOpen && !playlistCollapsed) {
      playlistWrapper.classList.add('collapsed');
      playlistChevron.textContent = "▸";
    }
    // If shortcuts closed, open playlist
    else if (!shortcutsOpen && playlistCollapsed) {
      playlistWrapper.classList.remove('collapsed');
      playlistChevron.textContent = "▾";
    }
  });
}


playlistToggle.onclick = () => {
  playlistWrapper.classList.toggle("collapsed");
  const isCollapsed = playlistWrapper.classList.contains("collapsed");
  playlistChevron.textContent = isCollapsed ? "▸" : "▾";

  // Toggle shortcuts - inverse of playlist
  if (shortcutsEl) {
    if (isCollapsed) {
      shortcutsEl.setAttribute('open', '');
    } else {
      shortcutsEl.removeAttribute('open');
    }
  }
};

document.addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT") return;

  switch (e.key) {
    case " ":
      e.preventDefault();
      audio.paused ? audio.play() : audio.pause();
      break;
    case "ArrowUp":
      e.preventDefault();
      prevTrack();
      break;
    case "ArrowDown":
      e.preventDefault();
      nextTrack();
      break;
    case "ArrowLeft":
      e.preventDefault();
      if (currentIndex !== -1) {
        const prevIndex = (currentIndex - 1 + albums.length) % albums.length;
        window.location.href = `/${encodeURIComponent(albums[prevIndex])}/`;
      }
      break;
    case "ArrowRight":
      e.preventDefault();
      if (currentIndex !== -1) {
        const nextIndex = (currentIndex + 1) % albums.length;
        window.location.href = `/${encodeURIComponent(albums[nextIndex])}/`;
      }
      break;
    case "h":
    case "H":
      e.preventDefault();
      playlistToggle.click();
      break;
    case "l":
    case "L":
      loopBtn.click();
      break;
    case "a":
    case "A":
      autoplayBtn.click();
      break;
    case "m":
    case "M":
      e.preventDefault();
      if (audio.volume > 0) {
        lastVolume = audio.volume;
        audio.volume = 0;
      } else {
        audio.volume = lastVolume;
      }
      volumeSlider.value = Math.round(audio.volume * 100);
      storage.set('musicPlayerVolume', volumeSlider.value);
      break;
  }
});

// Handle browser back/forward buttons via hash changes
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  const trackNumber = hash ? parseInt(hash, 10) : null;

  if (trackNumber !== null && !isNaN(trackNumber) && trackNumber >= 1 && trackNumber <= tracks.length) {
    const trackIndex = trackNumber - 1;
    // Only load if different from current track
    if (trackIndex !== index) {
      loadTrack(trackIndex, true);
    }
  }
});

// Initialize player with URL track number if present
const initialTrack = window.initialTrackIndex;
if (initialTrack !== null) {
  loadTrack(initialTrack, true);
} else {
  loadTrack(0, true);
  // Set URL hash for consistency with navigation links
  if (!window.location.hash) {
    window.location.hash = '1';
  }
}

const albums = window.albums;
if (!albums) {
  console.error('ERROR: music not loaded!');
}

// Get current album from path (strip leading/trailing slashes)
const currentAlbum = window.currentAlbum || '';
const currentIndex = albums.indexOf(currentAlbum);

if (currentIndex !== -1) {
  const prevIndex = (currentIndex - 1 + albums.length) % albums.length;
  const nextIndex = (currentIndex + 1) % albums.length;

  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.innerHTML = `
    <a href="/${encodeURIComponent(albums[prevIndex])}/">LAST</a>
    <a href="/">HOME</a>
    <a href="/${encodeURIComponent(albums[nextIndex])}/">NEXT</a>
  `;
  document.body.appendChild(footer);
}
