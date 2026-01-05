// ui/config-panel.js
// Auto-generates configuration UI from schema

export class ConfigPanel {
  constructor(configManager, schema, container) {
    this.configManager = configManager;
    this.schema = schema;
    this.container = container;
    this.sections = new Map();
    this.controls = new Map();
  }

  generate() {
    // Group schema entries by prefix
    const grouped = this.groupByPrefix();

    // Create collapsible section for each group
    for (const [prefix, entries] of Object.entries(grouped)) {
      const section = this.createCollapsibleSection(prefix, entries);
      this.container.appendChild(section);
    }
  }

  groupByPrefix() {
    const groups = {};

    for (const [path, spec] of Object.entries(this.schema)) {
      // Get first part of path as group name
      const prefix = path.split('.')[0];

      if (!groups[prefix]) {
        groups[prefix] = [];
      }

      groups[prefix].push({ path, spec });
    }

    return groups;
  }

  createCollapsibleSection(prefix, entries) {
    const section = document.createElement('div');
    section.className = 'config-section';

    // Section header
    const header = document.createElement('div');
    header.className = 'config-section-header';
    header.textContent = this.capitalizeFirst(prefix);

    // Content container
    const content = document.createElement('div');
    content.className = 'config-section-content';
    content.style.display = 'block'; // Start expanded

    // Toggle collapse on header click
    let isCollapsed = false;
    header.addEventListener('click', () => {
      isCollapsed = !isCollapsed;
      content.style.display = isCollapsed ? 'none' : 'block';
      header.classList.toggle('collapsed', isCollapsed);
    });

    // Create controls for each entry
    for (const { path, spec } of entries) {
      const control = this.createControl(path, spec);
      if (control) {
        content.appendChild(control);
      }
    }

    section.appendChild(header);
    section.appendChild(content);

    return section;
  }

  createControl(path, spec) {
    switch (spec.type) {
      case 'slider':
        return this.createSlider(path, spec);
      case 'checkbox':
        return this.createCheckbox(path, spec);
      case 'select':
        return this.createSelect(path, spec);
      case 'number':
        return this.createNumberInput(path, spec);
      case 'color':
        return this.createColorPicker(path, spec);
      default:
        console.warn(`Unknown control type: ${spec.type}`);
        return null;
    }
  }

  createSlider(path, spec) {
    const wrapper = document.createElement('div');
    wrapper.className = 'config-control';

    // Label
    const label = document.createElement('label');
    label.textContent = spec.label;
    label.className = 'config-label';

    // Value display
    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'config-value';
    const currentValue = this.configManager.get(path);
    valueDisplay.textContent = currentValue !== undefined ? currentValue : spec.min;

    // Slider input
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = spec.min;
    slider.max = spec.max;
    slider.step = spec.step || 0.01;
    slider.value = currentValue !== undefined ? currentValue : spec.min;
    slider.className = 'config-slider';

    // Update on input
    slider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      valueDisplay.textContent = value.toFixed(2);
      this.configManager.set(path, value);
      this.onConfigChange(path, value);
    });

    // Description
    const description = this.createDescription(spec.description);

    wrapper.appendChild(label);
    wrapper.appendChild(valueDisplay);
    wrapper.appendChild(slider);
    if (description) wrapper.appendChild(description);

    this.controls.set(path, { element: slider, valueDisplay });

    return wrapper;
  }

  createCheckbox(path, spec) {
    const wrapper = document.createElement('div');
    wrapper.className = 'config-control';

    // Checkbox container
    const checkboxContainer = document.createElement('label');
    checkboxContainer.className = 'config-checkbox-container';

    // Checkbox input
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'config-checkbox';
    const currentValue = this.configManager.get(path);
    checkbox.checked = currentValue !== undefined ? currentValue : false;

    // Label text
    const labelText = document.createElement('span');
    labelText.textContent = spec.label;
    labelText.className = 'config-label';

    // Update on change
    checkbox.addEventListener('change', (e) => {
      this.configManager.set(path, e.target.checked);
      this.onConfigChange(path, e.target.checked);
    });

    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(labelText);
    wrapper.appendChild(checkboxContainer);

    // Description
    const description = this.createDescription(spec.description);
    if (description) wrapper.appendChild(description);

    this.controls.set(path, { element: checkbox });

    return wrapper;
  }

  createSelect(path, spec) {
    const wrapper = document.createElement('div');
    wrapper.className = 'config-control';

    // Label
    const label = document.createElement('label');
    label.textContent = spec.label;
    label.className = 'config-label';

    // Select input
    const select = document.createElement('select');
    select.className = 'config-select';
    const currentValue = this.configManager.get(path);

    // Add options
    for (const option of spec.options) {
      const optionElement = document.createElement('option');
      optionElement.value = option;
      optionElement.textContent = option;
      if (option === currentValue) {
        optionElement.selected = true;
      }
      select.appendChild(optionElement);
    }

    // Update on change
    select.addEventListener('change', (e) => {
      // Parse numeric values
      const value = isNaN(e.target.value) ? e.target.value : Number(e.target.value);
      this.configManager.set(path, value);
      this.onConfigChange(path, value);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(select);

    // Description
    const description = this.createDescription(spec.description);
    if (description) wrapper.appendChild(description);

    this.controls.set(path, { element: select });

    return wrapper;
  }

  createNumberInput(path, spec) {
    const wrapper = document.createElement('div');
    wrapper.className = 'config-control';

    // Label
    const label = document.createElement('label');
    label.textContent = spec.label;
    label.className = 'config-label';

    // Number input
    const input = document.createElement('input');
    input.type = 'number';
    input.min = spec.min;
    input.max = spec.max;
    input.step = spec.step || 1;
    input.className = 'config-number';
    const currentValue = this.configManager.get(path);
    input.value = currentValue !== undefined ? currentValue : spec.min;

    // Update on change
    input.addEventListener('change', (e) => {
      const value = parseFloat(e.target.value);
      this.configManager.set(path, value);
      this.onConfigChange(path, value);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(input);

    // Description
    const description = this.createDescription(spec.description);
    if (description) wrapper.appendChild(description);

    this.controls.set(path, { element: input });

    return wrapper;
  }

  createColorPicker(path, spec) {
    const wrapper = document.createElement('div');
    wrapper.className = 'config-control';

    // Label
    const label = document.createElement('label');
    label.textContent = spec.label;
    label.className = 'config-label';

    // Color input
    const input = document.createElement('input');
    input.type = 'color';
    input.className = 'config-color';
    const currentValue = this.configManager.get(path);
    input.value = currentValue || '#000000';

    // Update on change
    input.addEventListener('change', (e) => {
      this.configManager.set(path, e.target.value);
      this.onConfigChange(path, e.target.value);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(input);

    // Description
    const description = this.createDescription(spec.description);
    if (description) wrapper.appendChild(description);

    this.controls.set(path, { element: input });

    return wrapper;
  }

  createDescription(text) {
    if (!text) return null;

    const desc = document.createElement('div');
    desc.className = 'config-description';
    desc.textContent = text;
    return desc;
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  onConfigChange(path, value) {
    // Emit custom event for other systems to listen to
    const event = new CustomEvent('configchange', {
      detail: { path, value }
    });
    this.container.dispatchEvent(event);
  }

  refresh() {
    // Update all control values from config
    for (const [path, control] of this.controls) {
      const value = this.configManager.get(path);

      if (control.element.type === 'checkbox') {
        control.element.checked = value;
      } else if (control.element.type === 'range') {
        control.element.value = value;
        if (control.valueDisplay) {
          control.valueDisplay.textContent = value.toFixed(2);
        }
      } else {
        control.element.value = value;
      }
    }
  }
}
