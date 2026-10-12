# ADR-0015: The user menu and one settings dialog follow SAP Fiori

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

## Date
2026-10-08

## Context
The authenticated shell was modelled on SAP, but over time each preference had
gained several editors. A survey of the live site (FW5, 2026-10-08) counted:

- language: four switches (public header, toolbar flag, sidebar flag, menu);
- theme: three (public header, sidebar, menu);
- date format, number format and table density: two editors each (menu and
  settings dialog), with different labels and option sets;
- version, environment and backend health: four places each.

The duplication had produced real bugs: for English users the menu showed
DD.MM.YYYY as active while MM/DD/YYYY was in force, because the menu offered
only two of the three date formats; the dialog's number-format labels were
hard-coded English in the German UI; the low-stock count appeared twice in the
menu.

A look at current enterprise suites and design guidance found one pattern:

- SAP Fiori: help is a mandatory shell-bar icon; the user menu (profile) holds
  Settings, About and Sign Out; theme sits in Settings > Appearance and language
  in Settings > Language and Region. In January 2026 SAP added a theme picker to
  its standard UserSettingsDialog (UI5 Web Components 2.18.0).
- Oracle (Settings and Actions menu: Preferences, Help, About, Sign Out),
  ServiceNow (preferences in the avatar menu's panel) and Microsoft Power Apps
  (one Personalization dialog with Formats and Languages) agree.
- No enterprise suite surveyed offers a language quick toggle in the app
  header; public websites put it in the header or footer.
- W3C i18n: do not use flags for languages; name each language in itself.
- Nielsen Norman Group: an unlabeled hidden menu icon in the top-right utility
  area had the lowest navigation use in its 2016 study.

## Decision
- **One editor per preference.** The settings dialog is the only place to change
  them: *Appearance* (theme, table density) and *Language & Region* (language,
  date format, number format). Language names stay "Deutsch" and "English".
- **User menu.** The toolbar's menu holds the profile, a Settings entry that
  opens the dialog, help and documentation links, system information and Sign
  Out; no preference editors. Its trigger is the three-line icon on desktop and
  a person outline below the md breakpoint, where the header already shows a
  three-line drawer toggle.
- **No quick toggles in the app shell.** The toolbar shows the health badge, a
  notification bell, help and the user menu. The public header keeps its theme
  icon and a text button that names the target language in that language.
- **Sidebar: navigation only.** Identity, settings, help and sign-out moved to
  the header and the user menu.
- **Notifications behind a bell.** The low-stock warning moved from the menu to
  a bell with the count as its badge, shown once.
- **Help.** The route-aware toolbar icon and the in-page help icons stay; the
  sidebar copy is gone.
- Language and theme state live in `ShellPreferencesProvider` (one owner for
  both shells); the dialog edits them through `useShellSettings`, which keeps the
  shell's confirmation toasts.

## Alternatives Considered
- **Keep both the menu and the dialog, with shared components**: removes the
  label and option drift but keeps two places for every setting.
- **Menu only, no dialog**: the menu is the cramped surface; the dialog already
  had the full option sets with previews.
- **A theme toggle in the toolbar** (MUI dashboard layout, Jira's shortcut):
  quicker, but it reintroduces a second editor for the theme.
- **An avatar or initials as the menu trigger** (SAP, ServiceNow): the
  three-line icon was kept on desktop by product decision; phones get the person
  outline to tell the two header buttons apart.

## Consequences
- Each preference has one editor, so the menu and dialog cannot disagree again.
- The flag assets (`public/flags/`) and ten menu and sidebar components were
  removed with their specs; sixteen translation keys that only they used were
  removed from both languages.
- Changing the language now takes two clicks more in the app shell; the public
  pages keep the one-click switch.
- On phones the drawer holds navigation only; everything else is in the header.

## Implementation Notes
- Settings dialog: `frontend/src/app/settings/` (`AppSettingsForm`,
  `sections/AppearanceSettingsSection`, `sections/LanguageRegionSettingsSection`).
- User menu: `frontend/src/app/HamburgerMenu/` (`HamburgerMenu`,
  `MenuContent/MenuSectionsRenderer`).
- Bell: `frontend/src/app/layout/header/NotificationBell.tsx`.
- Preferences: `frontend/src/context/shellPreferences/`,
  `frontend/src/app/layout/useShellSettings.ts`.

## Amendment 2026-10-08: system information
- **About dialog.** Version, build (first 10 characters, full hash in the
  title), environment, backend status and the database product live in one
  *About Smart Supply Pro* dialog, opened from the user menu as in SAP Fiori and
  Oracle. The menu's system-info block and the settings dialog's *System Info*
  card are gone.
- **Footer.** One compact line: current year, version, short build id and the
  demo-data note; the health chips stay, and the database chip shows the product
  the backend reports instead of the fixed text "Oracle ADB". Environment and the
  language tag left the footer. This keeps a deviation from SAP, which shows no
  footer: the deployed build stays visible without a click. The deploy check
  (`wait-for-build.sh`) reads the full build id from the bundle, not the footer.
- **One health source.** `useHealthCheck` is one shared React Query; the
  settings context no longer fetches `/api/health`.
- Implementation: `frontend/src/app/about/AboutDialog.tsx`,
  `frontend/src/app/footer/`, `frontend/src/features/health/hooks/useHealthCheck.ts`.

## Amendment 2026-10-12: avatar menu, settings in a rail, no hamburger
Ruled by Carlos after the FW6 survey (UX-1) and two rounds of mockups on the
real bundle with live demo data.

- **Avatar instead of the three-line icon.** The right end of the toolbar shows
  the user's initials in a round avatar ("DU" for the demo user), as SAP Fiori,
  Microsoft 365 and Jira place the profile. Its menu holds the profile (name,
  e-mail, role), *About Smart Supply Pro* and *Sign out*. The person-outline
  icon on phones is gone with it.
- **Settings in the sidebar.** One *Settings* entry under the navigation opens
  the settings dialog, still the only editor of every preference. On phones it
  sits in the drawer and closes the drawer before the dialog opens.
- **No hamburger menu.** With settings in the sidebar and About in the avatar
  menu, it would have held only the documentation links, which the footer of
  every page already carries, and the GitHub link, which moved into the About
  dialog. Its code and tests were deleted; the profile, sign-out and
  notification parts moved to `frontend/src/app/AccountMenu/` and
  `frontend/src/app/layout/header/notifications/`.
- **An 88 px rail on desktop.** The 248 px drawer held four entries and was
  mostly empty. The desktop sidebar is now a rail with the label under each icon
  (Material 3 navigation rail, SAP Fiori's collapsed side navigation); phones
  keep the 248 px drawer of full rows. The "Smart Supply Pro" title that sat
  hidden under the AppBar at the top of the drawer is gone; screen readers no
  longer read the product name twice.
- Language and theme stay out of the toolbar: none of the suites surveyed puts
  a language or theme button in the header bar (SAP's shell bar lists none;
  Microsoft 365 and Jira keep theme in settings or the avatar menu).
- Implementation: `frontend/src/app/AccountMenu/AccountMenu.tsx`,
  `frontend/src/app/layout/sidebar/SidebarSettingsItem.tsx`,
  `frontend/src/app/layout/sidebar/sidebarVariant.ts`,
  `frontend/src/app/layout/AppSidebar.tsx`.

## References
- [SAP Fiori: Shell Bar](https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/shell-bar/usage),
  [User Menu](https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/user-menu/usage)
- [UI5 Web Components PR #12739: appearance view in UserSettingsDialog](https://github.com/UI5/webcomponents/issues/12739)
- [Oracle: Settings and Actions menu](https://docs.oracle.com/en/cloud/saas/enterprise-performance-reporting-cloud/guepr/user_menu_161149.html)
- [ServiceNow Horizon: Unified navigation](https://horizon.servicenow.com/guidelines/unified-navigation)
- [Microsoft Learn: Set personal options](https://learn.microsoft.com/en-us/power-apps/user/set-personal-options)
- [W3C Internationalization: language negotiation](https://www.w3.org/International/questions/qa-site-conneg)
- [NN/g: Find navigation on desktop, not hamburger](https://www.nngroup.com/articles/find-navigation-desktop-not-hamburger/)
- [Microsoft 365: Change account settings](https://support.microsoft.com/en-us/topic/dbd1df27-7b78-4c32-8d48-129e5da5737a),
  [Atlassian: Theme in Jira](https://community.atlassian.com/t5/Jira-Software-articles/How-to-turn-on-dark-mode-in-Jira/ba-p/2371322)
- [SAP Fiori for Android: Navigation rail (Material 3)](https://www.sap.com/design-system/fiori-design-android/v26-4/components/m3-standard-components/navigation-rail/usage),
  [SAP Fiori: Side Navigation](https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/side-navigation/usage)
- Related ADRs: [ADR-0005](adr-0005-shell-split-authenticated-vs-public.md),
  [ADR-0007](adr-0007-i18n-strategy-and-language-region-settings.md)
