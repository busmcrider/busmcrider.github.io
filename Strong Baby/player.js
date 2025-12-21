const tracks = [
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
];

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


downloadBtn.onclick = () => {
    fetch(audio.src)
        .then(res => res.arrayBuffer())
        .then(data => {
            const blob = new Blob([data], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = nowPlaying.textContent + ".mp3";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        })
        .catch(err => console.error("Download failed:", err));
};

audio.volume = 1.0; // 100%

let lastVolume = 1.0;


volumeSlider.oninput = () => {
  audio.volume = volumeSlider.value / 100;
};


let index = 0;
let autoplay = true;
let loopMode = 2; // 0 off, 1 track, 2 all

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

function loadTrack(i, play=false) {
  index = i;
  audio.src = tracks[i].src;
  trackTitleEl.textContent = tracks[i].title;
  playlistTitle.textContent = tracks[i].title;

  [...playlistEl.children].forEach((li, n) =>
    li.classList.toggle("active", n === i)
  );

  scrollToActive();

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
  }
}

audio.onplay = () => {
  updatePlayIcon();
  scrollToActive();
};

audio.onpause = updatePlayIcon;

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
