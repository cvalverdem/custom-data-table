# Font Customization Guide

## Overview
The Data Table Extension now supports easy font customization! You can change both the font family and font size without any coding required.

## How to Configure

### Step 1: Add the Extension to Your Work Item
1. Open your Azure DevOps work item form
2. Go to **Layout** settings
3. Add the **Custom Data Table (DataTables) v3** control

### Step 2: Configure Font Settings
When adding or editing the control, you'll see these new options:

#### **Font Family**
- **Field Name**: Font Family
- **Description**: Choose a font family for the table. Leave empty for default.
- **Examples**:
  - `Arial` - Standard Arial font
  - `Verdana` - Verdana font
  - `Georgia` - Georgia serif font
  - `Courier New` - Monospace font
  - `Tahoma` - Tahoma font
  - `Inter` - Modern Inter font (if installed)
  - Leave **empty** to use system default

#### **Font Size (pixels)**
- **Field Name**: Font Size (pixels)
- **Description**: Set font size in pixels
- **Examples**:
  - `12` - Small text (12px)
  - `14` - Medium text (14px)
  - `16` - Large text (16px)
  - `18` - Extra large text (18px)
  - Leave **empty** to use default (13px)

## Configuration Examples

### Example 1: Larger, More Readable Text
```
Font Family: Arial
Font Size: 16
```
**Result**: Table displays in Arial font at 16px (larger than default)

### Example 2: Professional Look
```
Font Family: Segoe UI
Font Size: 14
```
**Result**: Modern Segoe UI font at 14px

### Example 3: Compact View
```
Font Family: Verdana
Font Size: 11
```
**Result**: Compact table with smaller text

### Example 4: Default Settings (No Customization)
```
Font Family: (leave empty)
Font Size: (leave empty)
```
**Result**: Uses system default fonts (13px)

## Tips

✅ **Safe Fonts**: Stick to common fonts like Arial, Verdana, Tahoma, or Segoe UI for best compatibility

✅ **Font Size Range**: Use sizes between 10-20px for optimal readability

✅ **Leave Empty for Defaults**: If you're happy with the current look, leave both fields empty

✅ **Test Your Settings**: After saving, check how the table looks in different work items

✅ **System Fallback**: The extension automatically adds fallback fonts, so if your chosen font isn't available, it will use system defaults

## Technical Details

### Font Validation
- Font sizes are validated to be between 8px and 32px
- Invalid sizes will default to 13px
- Font families automatically include system fallbacks for safety

### How It Works
The extension uses CSS custom properties to apply your font settings:
- Font family is applied with system fallbacks: `YourFont, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`
- Font size is applied in pixels with validation

### Backward Compatibility
- Existing extensions without font configuration will work exactly as before
- No breaking changes to existing configurations
- All empty fields use sensible defaults

## Troubleshooting

**Q: My custom font isn't showing up**
- Make sure the font name is spelled correctly
- Verify the font is installed on users' systems
- Try a common system font like Arial or Verdana

**Q: Font size seems too small/large**
- Adjust the pixel value in increments of 2 (e.g., 12, 14, 16)
- Recommended range: 11-18px for most use cases

**Q: Settings not applying**
- Save the work item form configuration
- Refresh the work item page
- Clear browser cache if needed

**Q: Want to reset to defaults**
- Simply clear both font fields (leave empty)
- Save the configuration

## Support
For issues or questions, please visit: https://github.com/shashankdhakated/dynamic-datatable-extension/issues

