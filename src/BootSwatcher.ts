
/**
 * BootSwatcher Web Component (TypeScript)
 * Offline-ready theme switcher for Bootswatch v5 + default Bootstrap, with dark mode toggle.
 *
 * Attributes:
 * - themes-url: URL to JSON array of theme names (default: ./themes/themes.json)
 * - themes-path: Directory to themes (default: ./themes)
 * - link-id: id of <link> element controlling the active theme (default: bootswatch-theme)
 * - default-theme: default theme when nothing saved (default: bootstrap)
 * - default-mode: light | dark | auto (default: auto)
 * - show-label: present attribute to show label
 * - show-mode-toggle: present attribute to show dark mode toggle
 * - compact: present attribute to render compact UI (reduced spacing)
 * - invisible: present attribute to apply theme/mode without rendering UI
 * - insert-link: present to insert <link id="..." rel="stylesheet"> if missing
 *
 * Events:
 * - themechange: { detail: { theme: string } }
 * - modechange: { detail: { mode: 'light' | 'dark' } }
 */
export type ColorMode = 'light' | 'dark';

export class BootSwatcher extends HTMLElement {
  static get storageThemeKey(): string { return 'bootswatcher:theme'; }
  static get storageModeKey(): string { return 'bootswatcher:mode'; }

  static get observedAttributes(): string[] {
    return [
      'themes-url','themes-path','link-id','default-theme','default-mode',
      'show-label','show-mode-toggle','compact','invisible','insert-link'
    ];
  }

  private _select: HTMLSelectElement | null = null;
  private _modeSwitch: HTMLInputElement | null = null;
  private _themes: string[] = [];

  private get themesUrl(): string { return this.getAttribute('themes-url') || './themes/themes.json'; }
  private get themesPath(): string { return this.getAttribute('themes-path') || './themes'; }
  private get linkId(): string { return this.getAttribute('link-id') || 'bootswatch-theme'; }
  private get defaultTheme(): string { return this.getAttribute('default-theme') || 'bootstrap'; }
  private get defaultModeAttr(): string { return (this.getAttribute('default-mode') || 'auto').toLowerCase(); }
  private get showLabel(): boolean { return this.hasAttribute('show-label'); }
  private get showModeToggle(): boolean { return this.hasAttribute('show-mode-toggle'); }
  private get compact(): boolean { return this.hasAttribute('compact'); }
  private get invisible(): boolean { return this.hasAttribute('invisible'); }
  private get insertLink(): boolean { return this.hasAttribute('insert-link'); }

  connectedCallback(): void {
    this.render();
    this.loadThemes().then(() => {
      this.populate();
      const savedTheme = this.getSavedTheme();
      const savedMode = this.getSavedMode();
      this.ensureLink();
      if (this._select) this._select.value = savedTheme;
      if (this._modeSwitch) this._modeSwitch.checked = (savedMode === 'dark');
      this.applyTheme(savedTheme);
      this.applyMode(savedMode);
      this.wire();
    });
  }

  attributeChangedCallback(): void {
    this.render();
    this.populate();
  }

  /** Public API */
  public setTheme(theme: string): void {
    this.ensureLink();
    this.applyTheme(theme);
    this.saveTheme(theme);
    if (this._select) this._select.value = theme;
    this.dispatchEvent(new CustomEvent('themechange', { detail: { theme }, bubbles: true }));
  }
  public setMode(mode: ColorMode): void {
    this.applyMode(mode);
    this.saveMode(mode);
    if (this._modeSwitch) this._modeSwitch.checked = (mode === 'dark');
    this.dispatchEvent(new CustomEvent('modechange', { detail: { mode }, bubbles: true }));
  }

  private render(): void {
    if (this.invisible) { this.innerHTML = ''; this._select = null; this._modeSwitch = null; return; }
    const wrapper = document.createElement('div');
    wrapper.className = 'd-inline-flex align-items-center ' + (this.compact ? 'gap-1' : 'gap-2');

    if (this.showLabel) {
      const label = document.createElement('label');
      label.className = this.compact ? 'form-label mb-0 visually-hidden' : 'form-label mb-0';
      label.textContent = 'Theme';
      label.htmlFor = 'bsw-select';
      wrapper.appendChild(label);
    }

    const select = document.createElement('select');
    select.id = 'bsw-select';
    select.className = 'form-select form-select-sm';
    select.style.minWidth = this.compact ? '10rem' : '14rem';
    this._select = select;
    wrapper.appendChild(select);

    if (this.showModeToggle) {
      const form = document.createElement('div');
      form.className = 'form-check form-switch ' + (this.compact ? 'ms-1' : 'ms-2');
      const checkbox = document.createElement('input');
      checkbox.className = 'form-check-input';
      checkbox.type = 'checkbox';
      checkbox.id = 'bsw-darkmode';
      const label = document.createElement('label');
      label.className = this.compact ? 'form-check-label visually-hidden' : 'form-check-label';
      label.htmlFor = 'bsw-darkmode';
      label.textContent = 'Dark mode';
      form.appendChild(checkbox);
      form.appendChild(label);
      this._modeSwitch = checkbox;
      wrapper.appendChild(form);
    }

    this.innerHTML = '';
    this.appendChild(wrapper);
  }

  private async loadThemes(): Promise<void> {
    const fallback = [
      'bootstrap','cerulean','cosmo','cyborg','darkly','flatly','journal','litera','lumen','lux',
      'materia','minty','morph','pulse','quartz','sandstone','simplex','sketchy','slate',
      'solar','spacelab','superhero','united','vapor','yeti','zephyr'
    ];
    try {
      const res = await fetch(this.themesUrl, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length) {
          this._themes = ['bootstrap', ...data.filter((t: string) => t && t !== 'bootstrap')];
          return;
        }
      }
      this._themes = fallback;
    } catch { this._themes = fallback; }
  }

  private populate(): void {
    if (!this._select) return;
    this._select.innerHTML = '';
    this._themes.forEach((name) => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name === 'bootstrap' ? 'Bootstrap (default)' : name[0].toUpperCase() + name.slice(1);
      this._select!.appendChild(opt);
    });
  }

  private wire(): void {
    if (this.invisible) return;
    this._select?.addEventListener('change', () => {
      const theme = this._select!.value;
      this.setTheme(theme);
    });
    this._modeSwitch?.addEventListener('change', () => {
      const mode: ColorMode = this._modeSwitch!.checked ? 'dark' : 'light';
      this.setMode(mode);
    });
  }

  private ensureLink(): void {
    let link = document.getElementById(this.linkId) as HTMLLinkElement | null;
    if (!link && this.insertLink) {
      link = document.createElement('link');
      link.id = this.linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }

  private saveTheme(theme: string): void { try { localStorage.setItem(BootSwatcher.storageThemeKey, theme); } catch {} }
  private saveMode(mode: ColorMode): void { try { localStorage.setItem(BootSwatcher.storageModeKey, mode); } catch {} }

  private getSavedTheme(): string {
    try { return localStorage.getItem(BootSwatcher.storageThemeKey) || this.defaultTheme; }
    catch { return this.defaultTheme; }
  }

  private getSavedMode(): ColorMode {
    try {
      const saved = localStorage.getItem(BootSwatcher.storageModeKey) as ColorMode | null;
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    const def = this.defaultModeAttr;
    if (def === 'dark' || def === 'light') return def;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  private applyTheme(theme: string): void {
    const link = document.getElementById(this.linkId) as HTMLLinkElement | null;
    if (!link) return; // respect insertLink attr to create if needed
    const href = theme === 'bootstrap' ? `${this.themesPath}/bootstrap.min.css` : `${this.themesPath}/${theme}/bootstrap.min.css`;
    link.setAttribute('href', href);
  }

  private applyMode(mode: ColorMode): void {
    document.documentElement.setAttribute('data-bs-theme', mode);
  }
}

customElements.define('boot-swatcher', BootSwatcher);
