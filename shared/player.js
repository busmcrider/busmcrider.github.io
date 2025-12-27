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
if (typeof tracks === 'undefined') {
  console.error('❌ ERROR: No tracks array found!');
  console.error('Make sure music.js is loaded OR inline <script> with tracks exists in your HTML.');
  alert('Music player error: No tracks found. Check console for details.');
}

downloadBtn.onclick = () => {
  const link = document.createElement("a");
  link.href = audio.src;
  link.download = tracks[index].title + ".mp3";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

audio.volume = 1.0; // 100%

let lastVolume = 1.0;


volumeSlider.oninput = () => {
  audio.volume = volumeSlider.value / 100;
};


let index = 0;
let autoplay = true;
let loopMode = 0; // 0 off, 1 track, 2 all

let shouldScroll = false;

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

  scrollToActive();
  updateMediaSession();

  // Enable scrolling for long titles
  trackTitleEl.classList.remove('long');
  trackTitleEl.style.setProperty('--scroll-distance', '0px');
  trackTitleEl.removeAttribute('data-title');

  requestAnimationFrame(() => {
    const textWidth = trackTitleEl.scrollWidth;
    const elementWidth = trackTitleEl.offsetWidth;

    if (textWidth > elementWidth + 3) {
      shouldScroll = true;
      const scrollDistance = -(textWidth + 50); // Full text width + gap
      trackTitleEl.style.setProperty('--scroll-distance', `${scrollDistance}px`);

      // Calculate duration for consistent scroll speed (25px/s)
      const scrollSpeed = 25; // pixels per second
      const scrollTime = Math.abs(scrollDistance) / scrollSpeed;
      const totalDuration = scrollTime / 0.9; // 90% is scrolling, 10% is pause
      const duration = Math.max(8, Math.min(30, totalDuration)); // Clamp between 8-30s
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
prevBtn.onclick = () =>
  loadTrack((index - 1 + tracks.length) % tracks.length, true);

function nextTrack() {
  if (index < tracks.length - 1) {
    loadTrack(index + 1, true);
  } else if (loopMode === 2) {
    loadTrack(0, true);
  } else if (loopMode === 0 && autoplay && currentIndex !== -1) {
    // We're at the end of the playlist, loop is OFF, autoplay is ON
    // Navigate to next album
    const nextIndex = (currentIndex + 1) % albums.length;
    window.location.href = `/${encodeURIComponent(albums[nextIndex])}/`;
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

playlistToggle.onclick = () => {
  playlistWrapper.classList.toggle("collapsed");
  playlistChevron.textContent =
    playlistWrapper.classList.contains("collapsed") ? "▸" : "▾";
};

document.addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT") return;

  switch (e.key) {
    case " ":
      e.preventDefault();
      audio.paused ? audio.play() : audio.pause();
      break;
    case "ArrowRight":
      nextTrack();
      break;
    case "ArrowLeft":
      prevBtn.click();
      break;
    case "l":
    case "L":
      loopBtn.click();
      break;
    case "a":
    case "A":
      autoplayBtn.click();
      break;
      case "ArrowUp":
  e.preventDefault();
  audio.volume = Math.min(1, audio.volume + 0.1);
  volumeSlider.value = Math.round(audio.volume * 100);
  break;
case "ArrowDown":
  e.preventDefault();
  audio.volume = Math.max(0, audio.volume - 0.1);
  volumeSlider.value = Math.round(audio.volume * 100);
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
    break;
  }
});

loadTrack(0);

const albums = window.albums;

if (!albums) {
  console.error('ERROR: music not loaded!');
}

// Get current path and decode URL encoding
const currentPath = window.location.pathname.replace(/^\/|\/$/g, '');
const currentAlbum = decodeURIComponent(currentPath);

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
