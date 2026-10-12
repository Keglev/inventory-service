/**
 * @file pagePanel.ts
 * @module theme/pagePanel
 *
 * @summary
 * Shape of the white panel each app page (dashboard, analytics, inventory,
 * suppliers) lays its cards on.
 *
 * @enterprise
 * The theme gives every Paper a 10px radius and a soft shadow. On the page panel
 * that rounded the corner next to the navigation rail, so a grey seam showed
 * between rail and panel (Carlos, 2026-10-12). The panel fills the whole main
 * area, so it is square and flat: rail and panel read as one surface, divided only
 * by the rail's 1px border. Cards on the panel keep their own radius and shadow.
 */
export const pagePanelSx = { borderRadius: 0, boxShadow: 'none' } as const;

/**
 * Distance from the navigation rail to the page content on desktop, where the rail
 * is shown (md and up). One value for every page, so cards line up when switching
 * pages (Carlos, 2026-10-12: 15px; before, 24px on three pages and 16px on
 * suppliers). Use as `pl` or `ml`; phones keep their own padding.
 */
export const railGutter = { md: '15px' } as const;
