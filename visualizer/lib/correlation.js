export function calculateBandAmplitudes(dataArray, bands, nyquist) {
  const bandValues = new Array(bands.length).fill(0);

  bands.forEach((band, i) => {
    const startIndex = Math.floor((band.min / nyquist) * dataArray.length);
    const endIndex = Math.ceil((band.max / nyquist) * dataArray.length);
    let sum = 0;
    for (let j = startIndex; j < endIndex; j++) {
      sum += dataArray[j];
    }
    bandValues[i] = sum / (endIndex - startIndex || 1);
  });

  return bandValues;
}

export function smoothBands(history, current, depth) {
  const nextHistory = [...history, current];
  if (nextHistory.length > depth) nextHistory.shift();

  const smoothed = new Array(current.length).fill(0);
  nextHistory.forEach(frame => {
    frame.forEach((value, idx) => {
      smoothed[idx] += value;
    });
  });

  return {
    smoothed: smoothed.map(value => value / nextHistory.length),
    nextHistory,
  };
}

export function connectionStrength(a, b) {
  return Math.min(a, b);
}
