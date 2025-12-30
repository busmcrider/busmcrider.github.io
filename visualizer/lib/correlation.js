export function calculateBandAmplitudes(dataArray, bands, nyquist) {
  const bandValues = new Array(bands.length).fill(0);
  const bandCounts = new Array(bands.length).fill(0);

  bands.forEach((band, i) => {
    const startIndex = Math.floor((band.min / nyquist) * dataArray.length);
    const endIndex = Math.ceil((band.max / nyquist) * dataArray.length);
    for (let j = startIndex; j < endIndex; j++) {
      bandValues[i] += dataArray[j];
      bandCounts[i] += 1;
    }
    if (bandCounts[i] > 0) bandValues[i] /= bandCounts[i];
  });

  return bandValues.map(v => v / 255);
}

export function appendHistory(history, current, depth) {
  const nextHistory = [...history, current];
  if (nextHistory.length > depth) nextHistory.shift();
  return nextHistory;
}

function pearsonCorrelation(seriesA, seriesB) {
  const n = seriesA.length;
  if (n === 0) return 0;

  let sumA = 0;
  let sumB = 0;
  let sumAB = 0;
  let sumA2 = 0;
  let sumB2 = 0;

  for (let i = 0; i < n; i++) {
    const a = seriesA[i];
    const b = seriesB[i];
    sumA += a;
    sumB += b;
    sumAB += a * b;
    sumA2 += a * a;
    sumB2 += b * b;
  }

  const numerator = n * sumAB - sumA * sumB;
  const denominator = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));
  if (denominator === 0) return 0;
  return numerator / denominator;
}

export function correlationMatrix(history, nodes) {
  if (history.length < 10) return null;

  const correlations = Array.from({ length: nodes.length }, () => new Array(nodes.length).fill(0));

  for (let i = 0; i < nodes.length; i++) {
    const bandI = nodes[i].bandIndex;
    const seriesA = history.map(frame => frame[bandI]);

    for (let j = i + 1; j < nodes.length; j++) {
      const bandJ = nodes[j].bandIndex;
      const seriesB = history.map(frame => frame[bandJ]);
      const corr = pearsonCorrelation(seriesA, seriesB);
      correlations[i][j] = corr;
      correlations[j][i] = corr;
    }
  }

  return correlations;
}
