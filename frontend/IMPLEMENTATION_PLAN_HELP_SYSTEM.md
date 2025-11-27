# Global Help System Implementation Plan

## Overview
Implement a centralized, context-aware help system that provides users with contextual assistance across the entire application. Users can access help from the sidebar (main app help) or from within modals (feature-specific help).

## Architecture

### 1. Global Help Context
**File:** `src/context/HelpContext.tsx`

**Purpose:** Centralized state management for help system

**Structure:**
```typescript
interface HelpContextType {
  currentTopicId: string | null;
  isOpen: boolean;
  openHelp: (topicId: string) => void;
  closeHelp: () => void;
}

export const HelpContext = React.createContext<HelpContextType | undefined>(undefined);

export const HelpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State management logic
  // Close on Escape key
  // Return provider component
}
```

**Features:**
- Track `currentTopicId` (string | null)
- Track `isOpen` (boolean)
- `openHelp(topicId: string)` function
- `closeHelp()` function
- Close on Escape key press
- Simple context provider wrapper

---

### 2. Help Topics Registry
**File:** `src/help/topics.ts`

**Purpose:** Central registry of all help topics with metadata

**Structure:**
```typescript
export interface HelpTopic {
  id: string;
  titleKey: string;      // i18n key for title (e.g., "help:app.main.title")
  bodyKey: string;       // i18n key for body text (e.g., "help:app.main.body")
  linkKey?: string;      // optional i18n key for documentation link label
  category: 'general' | 'inventory' | 'suppliers' | 'analytics' | 'settings';
}

export const HELP_TOPICS: Record<string, HelpTopic> = {
  'app.main': {
    id: 'app.main',
    titleKey: 'help:app.main.title',
    bodyKey: 'help:app.main.body',
    linkKey: 'help:app.main.link',
    category: 'general',
  },
  'inventory.editItem': {
    id: 'inventory.editItem',
    titleKey: 'help:inventory.editItem.title',
    bodyKey: 'help:inventory.editItem.body',
    category: 'inventory',
  },
  'inventory.deleteItem': {
    id: 'inventory.deleteItem',
    titleKey: 'help:inventory.deleteItem.title',
    bodyKey: 'help:inventory.deleteItem.body',
    category: 'inventory',
  },
  'inventory.adjustQuantity': {
    id: 'inventory.adjustQuantity',
    titleKey: 'help:inventory.adjustQuantity.title',
    bodyKey: 'help:inventory.adjustQuantity.body',
    category: 'inventory',
  },
  'inventory.changePrice': {
    id: 'inventory.changePrice',
    titleKey: 'help:inventory.changePrice.title',
    bodyKey: 'help:inventory.changePrice.body',
    category: 'inventory',
  },
  'suppliers.manage': {
    id: 'suppliers.manage',
    titleKey: 'help:suppliers.manage.title',
    bodyKey: 'help:suppliers.manage.body',
    category: 'suppliers',
  },
  'suppliers.delete': {
    id: 'suppliers.delete',
    titleKey: 'help:suppliers.delete.title',
    bodyKey: 'help:suppliers.delete.body',
    category: 'suppliers',
  },
  'analytics.overview': {
    id: 'analytics.overview',
    titleKey: 'help:analytics.overview.title',
    bodyKey: 'help:analytics.overview.body',
    category: 'analytics',
  },
  'settings.preferences': {
    id: 'settings.preferences',
    titleKey: 'help:settings.preferences.title',
    bodyKey: 'help:settings.preferences.body',
    category: 'settings',
  },
};

export function getHelpTopic(id: string): HelpTopic | undefined {
  return HELP_TOPICS[id];
}
```

**Topics to Include:**
- `app.main` - Main app overview, navigation, modules
- `inventory.editItem` - How to edit inventory items
- `inventory.deleteItem` - Deleting items
- `inventory.adjustQuantity` - Adjusting quantities
- `inventory.changePrice` - Changing prices
- `suppliers.manage` - Managing suppliers
- `suppliers.delete` - Deleting suppliers
- `analytics.overview` - Understanding analytics dashboard
- `settings.preferences` - Settings dialog explanation

---

### 3. useHelp Custom Hook
**File:** `src/hooks/useHelp.ts`

**Purpose:** Simple hook to access help context anywhere

**Structure:**
```typescript
import { useContext } from 'react';
import { HelpContext, type HelpContextType } from '../context/HelpContext';

export const useHelp = (): HelpContextType => {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
};
```

**Usage:**
```typescript
const { openHelp, closeHelp, currentTopicId, isOpen } = useHelp();
openHelp('inventory.editItem');
```

---

### 4. Help Panel Component
**File:** `src/components/help/HelpPanel.tsx`

**Purpose:** Global help drawer that displays current help topic

**Structure:**
```typescript
interface HelpPanelProps {
  // Optional: customize width, animation, etc.
  width?: number;
  position?: 'right' | 'bottom';
}

const HelpPanel: React.FC<HelpPanelProps> = ({ width = 380, position = 'right' }) => {
  const { currentTopicId, isOpen, closeHelp } = useHelp();
  const { t } = useTranslation('help');

  if (!currentTopicId || !isOpen) return null;

  const topic = getHelpTopic(currentTopicId);
  if (!topic) return null;

  return (
    <Drawer
      anchor={position}
      open={isOpen}
      onClose={closeHelp}
      PaperProps={{
        sx: {
          width: position === 'right' ? width : '100%',
          height: position === 'bottom' ? 'auto' : '100%',
          boxShadow: 3,
        }
      }}
    >
      <Box sx={{ p: 3 }}>
        {/* Close button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t(topic.titleKey)}
          </Typography>
          <IconButton onClick={closeHelp} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Help content */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
          {t(topic.bodyKey)}
        </Typography>

        {/* Optional: documentation link */}
        {topic.linkKey && (
          <Button
            variant="outlined"
            size="small"
            endIcon={<OpenInNewIcon />}
            onClick={() => {
              // Could open documentation URL
              closeHelp();
            }}
          >
            {t(topic.linkKey)}
          </Button>
        )}
      </Box>
    </Drawer>
  );
};
```

**Features:**
- Right-side drawer by default (can be customized)
- Close button in header
- Displays topic title and body
- Optional documentation link
- Closes on backdrop click

---

### 5. i18n Help Content

#### English: `src/i18n/locales/en/help.json`
```json
{
  "app": {
    "main": {
      "title": "Application Overview",
      "body": "Welcome to Inventory Management. This application helps you manage inventory items, suppliers, and track stock movements. Use the left sidebar to navigate between different sections: Inventory, Suppliers, and Analytics.",
      "link": "View Full Documentation"
    }
  },
  "inventory": {
    "editItem": {
      "title": "Edit Inventory Item",
      "body": "Edit item details including name, code, minimum quantity, and supplier information. Changes are saved immediately and will be reflected in your inventory records."
    },
    "deleteItem": {
      "title": "Delete Item",
      "body": "Permanently remove an item from your inventory. This action cannot be undone. Deleted items will no longer appear in reports or analytics."
    },
    "adjustQuantity": {
      "title": "Adjust Quantity",
      "body": "Manually adjust the on-hand quantity for an item. Provide a reason for the adjustment (e.g., physical count, damage, theft). Adjustments are tracked for audit purposes."
    },
    "changePrice": {
      "title": "Change Price",
      "body": "Update the unit cost or selling price for an item. Historical prices are maintained for accurate financial reporting and trend analysis."
    }
  },
  "suppliers": {
    "manage": {
      "title": "Manage Suppliers",
      "body": "View and manage your list of suppliers. You can create new suppliers, edit existing information, or remove suppliers from your system."
    },
    "delete": {
      "title": "Delete Supplier",
      "body": "Remove a supplier from your system. Existing inventory items linked to this supplier will remain, but you won't be able to select this supplier for new items."
    }
  },
  "analytics": {
    "overview": {
      "title": "Analytics Dashboard",
      "body": "View key performance indicators, stock movements, financial summaries, and low-stock alerts. Use the filter bar to narrow results by date range and supplier."
    }
  },
  "settings": {
    "preferences": {
      "title": "Settings",
      "body": "Customize your application experience. Change date format, number format, table density, and view system information about your application and database."
    }
  }
}
```

#### German: `src/i18n/locales/de/help.json`
```json
{
  "app": {
    "main": {
      "title": "Anwendungsübersicht",
      "body": "Willkommen bei der Bestandsverwaltung. Diese Anwendung hilft Ihnen bei der Verwaltung von Bestandsartikeln, Lieferanten und der Verfolgung von Bestandsbewegungen. Verwenden Sie die linke Seitenleiste, um zwischen verschiedenen Abschnitten zu navigieren: Bestand, Lieferanten und Analysen.",
      "link": "Vollständige Dokumentation anzeigen"
    }
  },
  "inventory": {
    "editItem": {
      "title": "Bestandsartikel bearbeiten",
      "body": "Bearbeiten Sie Artikeldetails einschließlich Name, Code, Mindestmenge und Lieferanteninformationen. Änderungen werden sofort gespeichert und in Ihren Bestandsaufzeichnungen angezeigt."
    },
    "deleteItem": {
      "title": "Artikel löschen",
      "body": "Entfernen Sie einen Artikel dauerhaft aus Ihrem Bestand. Diese Aktion kann nicht rückgängig gemacht werden. Gelöschte Artikel werden nicht mehr in Berichten oder Analysen angezeigt."
    },
    "adjustQuantity": {
      "title": "Menge anpassen",
      "body": "Passen Sie die verfügbare Menge für einen Artikel manuell an. Geben Sie einen Grund für die Anpassung an (z. B. physische Zählung, Beschädigungen, Diebstahl). Anpassungen werden zu Prüfzwecken nachverfolgbar gemacht."
    },
    "changePrice": {
      "title": "Preis ändern",
      "body": "Aktualisieren Sie die Stückkosten oder den Verkaufspreis für einen Artikel. Historische Preise werden für genaue Finanzberichterstattung und Trendanalysen beibehalten."
    }
  },
  "suppliers": {
    "manage": {
      "title": "Lieferanten verwalten",
      "body": "Sehen Sie Ihre Lieferantenliste und verwalten Sie sie. Sie können neue Lieferanten erstellen, vorhandene Informationen bearbeiten oder Lieferanten aus dem System entfernen."
    },
    "delete": {
      "title": "Lieferant löschen",
      "body": "Entfernen Sie einen Lieferanten aus Ihrem System. Vorhandene Bestandsartikel, die mit diesem Lieferanten verbunden sind, bleiben erhalten, aber Sie können diesen Lieferanten nicht für neue Artikel auswählen."
    }
  },
  "analytics": {
    "overview": {
      "title": "Analyse-Dashboard",
      "body": "Sehen Sie Leistungskennzahlen, Bestandsbewegungen, Finanzübersichten und Meldungen für niedrige Bestände. Verwenden Sie die Filterleiste, um Ergebnisse nach Datumsbereich und Lieferant einzuschränken."
    }
  },
  "settings": {
    "preferences": {
      "title": "Einstellungen",
      "body": "Passen Sie Ihr Anwendungserlebnis an. Ändern Sie das Datumsformat, das Zahlenformat, die Tabellendichte und sehen Sie Systeminformationen zu Ihrer Anwendung und Datenbank."
    }
  }
}
```

---

### 6. Integration Points

#### 6.1 AppShell Integration
**File:** `src/app/AppShell.tsx`

**Add to imports:**
```typescript
import { HelpPanel } from '../components/help/HelpPanel';
```

**Add at end of JSX (after Footer, before closing Box):**
```tsx
<HelpPanel />
```

**Add help button to sidebar footer:**
```tsx
// In sidebar footer, next to theme toggle, language toggle, settings icon
<IconButton
  onClick={() => openHelp('app.main')}
  size="small"
  title={t('actions.help', 'Help')}
>
  <HelpOutlineIcon />
</IconButton>
```

#### 6.2 Modal Integration
Update the following modals to include help icon in DialogTitle:

**Files to update:**
- `src/pages/inventory/ItemFormDialog.tsx`
- `src/pages/inventory/EditItemDialog.tsx`
- `src/pages/inventory/DeleteItemDialog.tsx`
- `src/pages/inventory/QuantityAdjustDialog.tsx`
- `src/pages/inventory/PriceChangeDialog.tsx`
- `src/pages/suppliers/EditSupplierDialog.tsx` (if exists)
- `src/pages/suppliers/DeleteSupplierDialog.tsx` (if exists)

**Pattern in each modal:**
```tsx
<DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <Typography variant="h6">{title}</Typography>
  <IconButton
    onClick={() => openHelp('inventory.editItem')} // Change topic ID per modal
    size="small"
    title={t('actions.help', 'Help')}
  >
    <HelpOutlineIcon />
  </IconButton>
</DialogTitle>
```

#### 6.3 App Root Integration
**File:** `src/App.tsx`

**Update imports:**
```typescript
import { HelpProvider } from './context/HelpContext';
```

**Wrap JSX:**
```tsx
<HelpProvider>
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
    {/* existing content */}
  </Box>
</HelpProvider>
```

**Ensure stacking order:**
```
HelpProvider (outermost)
  → SettingsProvider
    → Box (app layout)
      → AppRouter
      → Footer
```

---

## Implementation Phases

### Phase 1: Foundation
1. Create `HelpContext.tsx`
2. Create `topics.ts` registry
3. Create `useHelp.ts` hook
4. Create `HelpPanel.tsx` component
5. Create i18n help.json files (EN & DE)
6. Register help namespace in i18n config

### Phase 2: Integration
1. Wrap App.tsx with HelpProvider
2. Add HelpPanel to AppShell
3. Add help button to sidebar footer
4. Test main app help

### Phase 3: Modal Help
1. Add help icons to ItemFormDialog
2. Add help icons to EditItemDialog
3. Add help icons to DeleteItemDialog
4. Add help icons to QuantityAdjustDialog
5. Add help icons to PriceChangeDialog
6. Add help icons to supplier modals (if applicable)

### Phase 4: Enhancement (Optional)
1. Add analytics help
2. Add search/discovery to help system
3. Add video embedding support (future)
4. Add breadcrumb navigation in help topics (future)

---

## File Structure

```
src/
├── context/
│   └── HelpContext.tsx              # Global help state
│
├── help/
│   └── topics.ts                    # Registry of help topics
│
├── hooks/
│   └── useHelp.ts                   # Custom hook wrapper
│
├── components/
│   └── help/
│       └── HelpPanel.tsx            # Global help drawer
│
└── i18n/
    └── locales/
        ├── en/
        │   └── help.json            # English help content
        └── de/
            └── help.json            # German help content
```

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Right-side drawer** | Complements left sidebar; doesn't block main content |
| **Global context** | Single source of truth; accessible anywhere without prop drilling |
| **i18n for all content** | Supports multilingual help; easy to expand |
| **Topic registry** | Centralized; easy to add/remove topics; type-safe |
| **Help in modal headers** | Discoverable; doesn't interrupt modal workflow |
| **Escape key closes** | Standard UX pattern; improves discoverability |
| **Optional links** | Future-proofing for documentation URLs |

---

## User Experience

### Main App Help Flow
1. User sees "?" icon in sidebar footer
2. Clicks it → Help panel slides in from right
3. Reads overview of app and navigation
4. Closes by clicking X or pressing Escape

### Modal-Specific Help Flow
1. User opens modal (e.g., Edit Item)
2. Sees "?" icon in DialogTitle
3. Clicks → Help panel opens with edit-specific help
4. Returns to modal → help still available
5. Closes modal → help panel auto-closes

### Benefits
- Non-intrusive; doesn't disrupt workflows
- Context-aware; help matches what user is doing
- Accessible; visible from anywhere in app
- Multilingual; respects app language settings

---

## Success Criteria

- ✅ Help context created and typed
- ✅ All major features have help topics
- ✅ Help accessible from sidebar
- ✅ Help accessible from modals
- ✅ Help panel displays correct content
- ✅ Help respects i18n language setting
- ✅ Escape key closes help
- ✅ No TypeScript errors
- ✅ Help panel doesn't break responsive layout

---

## Notes for Review

1. **Approval needed on:**
   - Number and scope of help topics
   - Help text tone (instructional vs. technical)
   - Placement of help buttons in modals
   - Drawer animation and width

2. **Future Enhancements (Priority Order):**

   **2.1 Search & Discovery (High Priority)**
   - Add search input at top of help panel
   - Index help topics by title, body, category, keywords
   - Real-time search filtering as user types
   - Keyboard shortcut (Ctrl+?) to open help with search focused
   - Search results show topic ID, title, category
   - Click result → loads full help topic
   
   **2.2 Field-Level Tooltips (High Priority)**
   - Add "?" icons next to complex form labels
   - Examples:
     - "Minimum Quantity ?" → explains stock threshold logic
     - "Unit Cost ?" → explains cost calculation impact
     - "Supplier ?" → explains role in ordering
   - Options for implementation:
     - **Option A:** Inline tooltip (MUI Tooltip) with brief help text
     - **Option B:** Inline "?" icon → links to full help panel with context
     - **Recommendation:** Use Option B for consistency; all help flows to same panel
   - Fields to consider:
     - Inventory: name, code, supplier, minQty, onHand, unitCost
     - Suppliers: name, contactName, email, phone
     - Settings: dateFormat, numberFormat, tableDensity

   **2.3 Keyboard Shortcuts Guide (Medium Priority)**
   - Add "Keyboard Shortcuts" as special help topic
   - Show shortcuts for:
     - Escape: Close help
     - Ctrl+?: Open help with search
     - Ctrl+N: New item
     - Ctrl+S: Save (in modals)
   - Display as help topic in help panel
   - Future: Global shortcuts reference modal

   **2.4 Video Tutorials (Lower Priority)**
   - Embed YouTube or video clips in help panel
   - Topics like "Getting Started", "Basic Workflow"
   - Requires custom help topic type supporting video URLs
   - Consider lazy-loading to avoid performance impact

   **2.5 Breadcrumb Navigation (Lower Priority)**
   - Show topic hierarchy: "Help > Inventory > Edit Item"
   - Allow navigation between related topics
   - "See also" links at bottom of help text
   - Examples:
     - From "Edit Item" → related "Adjust Quantity", "Change Price"
     - From "Suppliers" → related "Inventory Items"

   **2.6 Help Analytics (Optional)**
   - Track which help topics are most viewed
   - Identify gaps in help coverage
   - Inform future help text improvements
   - Requires backend telemetry

3. **i18n namespace:**
   - Ensure "help" namespace is registered in i18n config
   - Consider whether to use `t('help:key')` or `t('help.key')`
   - Recommendation: Use `'help'` as namespace prefix (e.g., `t('help:app.main.title')`)

4. **Accessibility:**
   - Help panel should be keyboard navigable
   - Close button should be discoverable
   - Dialog should trap focus within help panel
   - Search input should be immediately focusable
   - "?" icons should have aria-label for screen readers
   - Help text should not rely on color alone for emphasis

5. **Implementation Hints:**
   - Use MUI Tooltip for inline "?" icons (quick preview)
   - Use MUI Drawer for full help panel (consistent with current patterns)
   - Consider creating a `useHelpTopic(id)` hook for type-safe topic access
   - Pre-render help search index during app startup for performance
   - Consider collapsing help panel on mobile (use bottom drawer instead)

---

## Roadmap Suggestion

```
Phase 1: Foundation (MVP)
├── HelpContext, topics, hook, panel
├── 9 help topics
└── i18n EN/DE

Phase 2: Integration (MVP+)
├── AppShell sidebar help button
├── 6 modal help icons
└── Escape key closes help

Phase 3: Search & Tooltips (Soon)
├── Search in help panel
└── "?" field-level tooltips in forms

Phase 4: Enhancements (Future)
├── Keyboard shortcuts reference
├── Video support
└── Breadcrumb navigation
```
