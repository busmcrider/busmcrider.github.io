function createAudioAnalyzer(audioElement) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const source = ctx.createMediaElementSource(audioElement);
  const analyser = ctx.createAnalyser();

  analyser.fftSize = 2048;

  source.connect(analyser);
  analyser.connect(ctx.destination);

  const data = new Uint8Array(analyser.frequencyBinCount);

  function getBands() {
    analyser.getByteFrequencyData(data);

    const avg = (from, to) => {
      let sum = 0;
      for (let i = from; i < to; i++) sum += data[i];
      return sum / (to - from) / 255;
    };

    return {
      bass: avg(0, 10),
      mids: avg(10, 80),
      highs: avg(80, 200)
    };
  }

  return { ctx, getBands };
}

function createWorld() {
  return {
    rooms: [],
    scrollY: 0,
    cooldown: 0
  };
}

function updateWorld(world, audio) {
  world.scrollY += 0.5 + audio.bass * 2;
  world.cooldown--;

  if (audio.bass > 0.6 && world.cooldown <= 0) {
    spawnRoom(world, audio.bass);
    world.cooldown = 20;
  }
}

function spawnRoom(world, bass) {
  const width = 100 + bass * 200;
  const height = 60 + bass * 120;

  world.rooms.push({
    x: (window.innerWidth - width) / 2,
    y: world.scrollY + window.innerHeight,
    width,
    height,
    decorations: []
  });
}

function createRenderer(canvas) {
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener("resize", resize);
  resize();

  return {
    draw(world, audio) {
      ctx.fillStyle = "rgba(10,10,10,0.3)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      world.rooms.forEach((room, i) => {
        const y = room.y - world.scrollY;

        if (y > canvas.height || y + room.height < 0) return;

        // Room
        ctx.strokeStyle = `rgba(200,200,255,0.8)`;
        ctx.lineWidth = 2;
        ctx.strokeRect(room.x, y, room.width, room.height);

        // Connections (mids)
        if (i > 0) {
          const prev = world.rooms[i - 1];
          const py = prev.y - world.scrollY + prev.height / 2;
          const cx = room.x + room.width / 2;

          ctx.strokeStyle = `rgba(150,150,255,${audio.mids})`;
          ctx.lineWidth = 1 + audio.mids * 4;
          ctx.beginPath();
          ctx.moveTo(cx, y + room.height / 2);
          ctx.lineTo(cx, py);
          ctx.stroke();
        }

        // Decorations (highs)
        const count = Math.floor(audio.highs * 10);
        for (let j = 0; j < count; j++) {
          ctx.fillStyle = `rgba(255,255,255,0.6)`;
          ctx.fillRect(
            room.x + Math.random() * room.width,
            y + Math.random() * room.height,
            2,
            2
          );
        }
      });
    }
  };
}

const canvas = document.getElementById("canvas");
const audioEl = document.getElementById("audio");

const audio = createAudioAnalyzer(audioEl);
const world = createWorld();
const renderer = createRenderer(canvas);

audioEl.addEventListener("play", () => {
  audio.ctx.resume();
  requestAnimationFrame(loop);
});

function loop() {
  const bands = audio.getBands();
  updateWorld(world, bands);
  renderer.draw(world, bands);
  requestAnimationFrame(loop);
}
