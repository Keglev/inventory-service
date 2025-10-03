# Code Structure Refactoring Plan

## Current State Analysis

The `QuantityAdjustDialog` and `PriceChangeDialog` have significant duplication:

### 🔍 **Common Patterns Identified:**

1. **Supplier Selection Step**
   - Same supplier dropdown logic
   - Same loading/error states
   - Same validation patterns

2. **Item Selection Step**  
   - Same autocomplete with search
   - Same ItemAutocompleteOption component
   - Same supplier-scoped filtering

3. **Dialog Structure**
   - Same base dialog layout
   - Same action buttons
   - Same loading states

4. **Form Management**
   - Similar validation schemas (only differs in field names)
   - Same error handling patterns
   - Same submission flow

5. **Data Fetching**
   - Same supplier loading logic
   - Same item search patterns
   - Same item details fetching

---

## 🏗️ **Proposed Shared Components**

### ✅ **Already Created:**

1. **`InventoryDialogBase`** - Base dialog wrapper with consistent layout
2. **`SupplierItemSelector`** - Reusable supplier → item selection
3. **`inventoryDialogTypes`** - Shared types and validation schemas
4. **`useInventoryDialogState`** - Common state management

### 🎯 **Usage Pattern:**

```tsx
// Simplified QuantityAdjustDialog
export const QuantityAdjustDialog: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const dialogState = useInventoryDialogState({ open });
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(quantityAdjustSchema),
  });

  return (
    <InventoryDialogBase
      open={open}
      onClose={onClose}
      title={t('inventory.adjustQuantity')}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
    >
      <SupplierItemSelector
        selectedSupplierId={dialogState.selectedSupplier?.id || ''}
        onSupplierChange={(id) => setSelectedSupplier(suppliers.find(s => s.id === id))}
        selectedItem={dialogState.selectedItem}
        onItemChange={dialogState.setSelectedItem}
        selectedItemContent={
          <ItemDetailsDisplay 
            item={dialogState.selectedItem}
            showQuantity={true}
            showPrice={true}
          />
        }
      />
      
      {dialogState.isStep3Enabled && (
        <QuantityOperationStep
          control={control}
          errors={errors}
          currentQuantity={itemDetails?.quantity}
        />
      )}
    </InventoryDialogBase>
  );
};
```

---

## 📊 **Reduction in Code Duplication:**

### **Before Refactoring:**
- QuantityAdjustDialog: ~700 lines
- PriceChangeDialog: ~700 lines  
- **Total: ~1,400 lines**

### **After Refactoring:**
- QuantityAdjustDialog: ~150 lines
- PriceChangeDialog: ~150 lines
- Shared components: ~400 lines
- **Total: ~700 lines** (50% reduction!)

---

## 🔧 **Benefits:**

1. **Consistency** - Same UX patterns across all dialogs
2. **Maintainability** - Single source of truth for common logic  
3. **Testing** - Easier to test shared components independently
4. **Type Safety** - Centralized types prevent inconsistencies
5. **Performance** - Shared hooks reduce duplicate API calls
6. **Scalability** - Easy to add new inventory operations

---

## 📋 **Implementation Status:**

✅ **Completed:**
- Base dialog component
- Supplier-item selector
- Shared types and schemas  
- Dialog state management hook

🔄 **Next Steps:**
1. Create `ItemDetailsDisplay` component for quantity/price display
2. Create operation-specific step components  
3. Refactor existing dialogs to use shared components
4. Add comprehensive tests for shared components

---

## 🚀 **Would you like me to:**

1. **Show the refactored dialogs** using the shared components?
2. **Create the remaining shared components** (ItemDetailsDisplay, etc.)?
3. **Implement the refactoring step by step** with working code?

The foundation is in place - we can dramatically simplify both dialogs while maintaining all functionality!