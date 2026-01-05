// utils/storage.js
// localStorage wrapper for preset management (stub for Phase 2)

export function savePreset(name, config) {
  try {
    const key = `visualizer_preset_${name}`;
    localStorage.setItem(key, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Failed to save preset:', error);
    return false;
  }
}

export function loadPreset(name) {
  try {
    const key = `visualizer_preset_${name}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load preset:', error);
    return null;
  }
}

export function listPresets() {
  try {
    const presets = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('visualizer_preset_')) {
        const name = key.replace('visualizer_preset_', '');
        presets.push(name);
      }
    }
    return presets;
  } catch (error) {
    console.error('Failed to list presets:', error);
    return [];
  }
}

export function deletePreset(name) {
  try {
    const key = `visualizer_preset_${name}`;
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Failed to delete preset:', error);
    return false;
  }
}
