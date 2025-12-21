const tracks = [
  { title: "A1 - Sippin' on Gin", src: "audio/A1 - Sippin' on Gin.mp3" },
  { title: "A2 - Captain Save a Hoe", src: "audio/A2 - Captain Save a Hoe.mp3" },
  { title: "A3 - Bad Guy", src: "audio/A3 - Bad Guy.mp3" },
  { title: "A4 - Master of Strings", src: "audio/A4 - Master of Strings.mp3" },
  { title: "A5 - King Kunta", src: "audio/A5 - King Kunta.mp3" },
  { title: "A6 - Outlaw's Paradise", src: "audio/A6 - Outlaw's Paradise.mp3" },
  { title: "A7 - Regulate", src: "audio/A7 - Regulate.mp3" },
  { title: "B1 - Big Iron", src: "audio/B1 - Big Iron.mp3" },
  { title: "B2 - Friends in Low Places", src: "audio/B2 - Friends in Low Places.mp3" },
  { title: "B3 - Ring of Fire (Slow)", src: "audio/B3 - Ring of Fire (Slow).mp3" },
  { title: "B4 - Ring of Fire", src: "audio/B4 - Ring of Fire.mp3" },
  { title: "B5 - A Horse with No Name", src: "audio/B5 - A Horse with No Name.mp3" },
  { title: "B6 - Walk The Line", src: "audio/B6 - Walk The Line.mp3" },
  { title: "B7 - (Ghost)Riders", src: "audio/B7 - (Ghost)Riders.mp3" }
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
  nowPlaying.textContent = tracks[i].title;
  playlistTitle.textContent = tracks[i].title;

  [...playlistEl.children].forEach((li, n) =>
    li.classList.toggle("active", n === i)
  );

  scrollToActive();

  if (play) audio.play();
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
audio.ontimeupdate = () => seek.value = audio.currentTime;
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
