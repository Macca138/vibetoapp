# 🎨 UI/UX Documentation

This folder contains UI development strategies and fixes for visibility issues.

## 📄 Documents

### Strategy & Planning
- [`ui-strategy-guide.md`](./ui-strategy-guide.md) - When to fix UI issues vs continue development

### Fixes Applied
- [`ui-fixes-summary.md`](./ui-fixes-summary.md) - Summary of all critical UI fixes
- [`button-visibility-fixes.md`](./button-visibility-fixes.md) - Specific button and form visibility solutions

## 🔧 Common UI Issues & Solutions

### Invisible Buttons
- **Problem**: `primary-*` colors not rendering
- **Solution**: Changed to `blue-*` colors
- **Details**: [`button-visibility-fixes.md`](./button-visibility-fixes.md)

### Form Field Visibility
- **Problem**: Light borders (`gray-300`)
- **Solution**: Darker borders (`gray-400`) + shadows
- **Details**: [`ui-fixes-summary.md`](./ui-fixes-summary.md)

### Text Contrast
- **Problem**: Light gray text on light backgrounds
- **Solution**: Darker text colors (`gray-800` instead of `gray-700`)

## 🎨 Design System

### Colors (Working)
- Primary buttons: `bg-blue-600 hover:bg-blue-700`
- Secondary buttons: `bg-gray-100 hover:bg-gray-200`
- Borders: `border-gray-400`
- Text: `text-gray-900` (main), `text-gray-600` (secondary)

### Components
- Buttons with proper contrast
- Forms with visible borders
- Loading states with spinners
- Hover/focus states for accessibility