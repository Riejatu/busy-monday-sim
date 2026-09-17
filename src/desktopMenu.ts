// Simulated context menus.
//
// The browser's own menu is suppressed across the simulated screens: it offers
// "Open link in new tab", "Save video as" and "View page source", which both break
// the fiction and hand the learner the real URLs the exercise is about hiding.
//
// This is deliberately generic - a menu is just a list of items - so adding a menu for
// links, messages or icons later is a new item list rather than new machinery.

export interface MenuItem {
  label: string;
  /** Omit for a decorative or unavailable entry; it renders greyed out. */
  onSelect?: () => void;
  disabled?: boolean;
  /** Nested items. Mutually exclusive with onSelect. */
  submenu?: MenuItem[];
  /** Shows a radio mark, for one-of-many choices like icon size. */
  selected?: boolean;
}

export type MenuSection = MenuItem[];

let openMenu: HTMLElement | null = null;
let dismissListenersBound = false;

/** Closes any menu that is currently open. */
export function closeContextMenu(): void {
  openMenu?.remove();
  openMenu = null;
}

/**
 * Opens a menu at the pointer, flipped away from the viewport edges the way a real
 * one is. `sections` are separated by dividers.
 */
export function openContextMenu(x: number, y: number, sections: MenuSection[]): void {
  closeContextMenu();
  bindDismissListeners();

  const menu = buildMenu(sections);

  document.body.appendChild(menu);
  positionMenu(menu, x, y);

  openMenu = menu;

  // Keyboard users arrive here via Shift+F10, so the menu has to take focus.
  menu.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')?.focus();
}

function buildMenu(sections: MenuSection[]): HTMLElement {
  const menu = document.createElement("div");
  menu.className = "context-menu";
  menu.setAttribute("role", "menu");

  sections.forEach((items, index) => {
    if (index > 0) {
      const divider = document.createElement("div");
      divider.className = "context-menu-divider";
      divider.setAttribute("role", "separator");
      menu.appendChild(divider);
    }

    items.forEach((item) => menu.appendChild(buildItem(item)));
  });

  attachKeyboardNavigation(menu);

  return menu;
}

function buildItem(item: MenuItem): HTMLElement {
  const isDisabled = item.disabled || (!item.onSelect && !item.submenu);

  const element = document.createElement("div");
  element.className = "context-menu-item";
  element.setAttribute("role", "menuitem");
  element.tabIndex = isDisabled ? -1 : 0;

  if (isDisabled) {
    element.setAttribute("aria-disabled", "true");
  }

  if (item.selected) {
    element.classList.add("is-selected");
  }

  element.innerHTML = `
    <span class="context-menu-mark" aria-hidden="true">${item.selected ? "&bull;" : ""}</span>
    <span class="context-menu-label"></span>
    <span class="context-menu-chevron" aria-hidden="true">${item.submenu ? "&#8250;" : ""}</span>
  `;

  // textContent, not innerHTML: menu labels are localized strings.
  element.querySelector<HTMLElement>(".context-menu-label")!.textContent = item.label;

  if (item.submenu) {
    element.setAttribute("aria-haspopup", "true");
    element.appendChild(buildSubmenu(item.submenu));
    return element;
  }

  if (!isDisabled && item.onSelect) {
    const activate = (): void => {
      closeContextMenu();
      item.onSelect?.();
    };

    element.addEventListener("click", activate);
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
  }

  return element;
}

function buildSubmenu(items: MenuItem[]): HTMLElement {
  const submenu = document.createElement("div");
  submenu.className = "context-submenu";
  submenu.setAttribute("role", "menu");

  items.forEach((item) => submenu.appendChild(buildItem(item)));

  return submenu;
}

/** Arrow keys move between items; Escape closes. Matches menu conventions. */
function attachKeyboardNavigation(menu: HTMLElement): void {
  menu.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeContextMenu();
      return;
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return;
    }

    event.preventDefault();

    const items = [
      ...menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')
    ].filter((item) => item.offsetParent !== null);

    const current = items.indexOf(document.activeElement as HTMLElement);
    const step = event.key === "ArrowDown" ? 1 : -1;
    const next = (current + step + items.length) % items.length;

    items[next]?.focus();
  });
}

/** Keeps the menu on screen, flipping it like a native one near an edge. */
function positionMenu(menu: HTMLElement, x: number, y: number): void {
  const { width, height } = menu.getBoundingClientRect();
  const margin = 6;

  const left = x + width + margin > window.innerWidth ? x - width : x;
  const top = y + height + margin > window.innerHeight ? y - height : y;

  menu.style.left = `${Math.max(margin, left)}px`;
  menu.style.top = `${Math.max(margin, top)}px`;
}

/** Bound once; a menu that is not open ignores all of these. */
function bindDismissListeners(): void {
  if (dismissListenersBound) {
    return;
  }

  dismissListenersBound = true;

  document.addEventListener("pointerdown", (event) => {
    if (openMenu && !openMenu.contains(event.target as Node)) {
      closeContextMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (openMenu && event.key === "Escape") {
      closeContextMenu();
    }
  });

  window.addEventListener("blur", closeContextMenu);
  window.addEventListener("resize", closeContextMenu);
}
