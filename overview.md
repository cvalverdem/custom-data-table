# 🚀 Dynamic Data Table Extension for Azure DevOps

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/shashankdhakated/dynamic-datatable-extension) [![Issues](https://img.shields.io/badge/GitHub-Issues-red?logo=github)](https://github.com/shashankdhakated/dynamic-datatable-extension/issues)

**Transform your Azure DevOps work items with powerful, customizable data tables!**

This extension provides a **fully configurable data table control** that can be added to any work item type. Create custom tables with your own columns, data types, and validation rules - all through simple JSON configuration.

> **📦 Source Code:** [https://github.com/shashankdhakated/dynamic-datatable-extension](https://github.com/shashankdhakated/dynamic-datatable-extension)  
> **🐛 Report Issues:** [https://github.com/shashankdhakated/dynamic-datatable-extension/issues](https://github.com/shashankdhakated/dynamic-datatable-extension/issues)

![Extension in Action](images/full_size_extension.png)
*Dynamic Data Table Extension showing custom columns in a work item*

---

## ✨ **Key Features**

### 🎯 **Fully Dynamic & Configurable**
- **Custom Columns**: Define any number of columns with custom names and data types
- **Multiple Data Types**: Support for text, numbers, booleans, dates, and more
- **Flexible Configuration**: Easy JSON-based configuration through Azure DevOps Options panel
- **Real-time Validation**: Built-in validation for required fields and data types

### 🛡️ **Enterprise-Ready & Reliable**
- **Backward Compatible**: Existing data automatically migrates to new configurations
- **Auto-Save**: Changes are automatically saved as you type (with smart debouncing)
- **Field Detection**: Automatically finds and uses the correct work item field
- **HTML Sanitization**: Safely handles HTML fields and extracts JSON data
- **Error Recovery**: Graceful fallbacks and clear error messages

### 🎨 **Beautiful & User-Friendly**
- **Azure DevOps Native Styling**: Seamlessly integrates with Azure DevOps theme (light/dark)
- **Responsive Design**: Works perfectly on all screen sizes
- **Intuitive Interface**: Add rows, edit data, and delete entries with ease

---

# 📋 **Complete Setup Guide: From Organization to Working Extension**

## 🏢 **Phase 1: Install Extension to Organization**

### **Step 1: Access Azure DevOps Marketplace**

1. Navigate to the [Azure DevOps Marketplace](https://marketplace.visualstudio.com/azuredevops)
2. Search for "Dynamic Data Table Extension" or browse extensions

![Browse Marketplace](images/browse_marketplace.png)
*Azure DevOps Marketplace homepage*

### **Step 2: Find and Install Extension**

1. Search for the extension in the marketplace
2. Click on the extension to view details

![Search Marketplace](images/search_marketplace.png)
*Searching for the extension in marketplace*

3. Click **"Get it free"** to start installation

![Get Extension](images/get_it.png)
*Extension details page with "Get it free" button*

### **Step 3: Select Organization**

1. Choose the organization where you want to install the extension
2. Click **"Install"** to proceed

![Select Organization](images/select_org.png)
*Selecting target organization for installation*

### **Step 4: Confirm Installation**

1. Review the extension permissions and details
2. Click **"Proceed to organization"** to complete installation

![Proceed to Organization](images/proceed.png)
*Final confirmation before installation*

---

## 🔧 **Phase 2: Create Inherited Process**

### **Step 5: Access Organization Settings**

1. Go to your Azure DevOps organization
2. Click on **"Organization Settings"** (bottom left)

![Organization Settings](images/organisation_setting.png)
*Accessing organization settings*

### **Step 6: Navigate to Process Configuration**

1. In Organization Settings, click on **"Process"**
2. View all available processes

![Process Settings](images/process.png)
*Process configuration in organization settings*

![All Processes](images/all_process.png)
*List of all available processes*

### **Step 7: Create Inherited Process**

1. Find your base process (e.g., "Agile")
2. Click the **"..."** menu next to it
3. Select **"Create inherited process"**

![Create Inherited Process](images/create_inherit_process.png)
*Creating a new inherited process*

### **Step 8: Configure New Process**

1. Give your inherited process a name (e.g., "Agile with Data Tables")
2. Add description if needed
3. Click **"Create process"**

![New Inherited Process](images/new_inherit_process.png)
*Configuring the new inherited process*

---

## 📝 **Phase 3: Add Custom Field**

### **Step 9: Open Process Configuration**

1. Click on your newly created inherited process
2. This opens the process customization interface

![Open Process](images/open_process.png)
*Opening the inherited process for customization*

### **Step 10: Select Work Item Type**

1. Choose the work item type you want to enhance (e.g., "User Story")
2. Click on it to open customization options

![Click User Story](images/click_user_Story.png)
*Selecting User Story work item type*



### **Step 11: Add New Field**

1. Click **"New field"** to create a custom field for storing table data

![New Field Button](images/new_field_btn.png)
*Adding a new custom field*

### **Step 12: Configure Field Properties**

1. **Name**: Enter a Data Table JSON
2. **Type**: Select **"Text (multiple lines)"**
3. **Description**: Add helpful description
4. **Required**: Leave unchecked (recommended)


![Field Definition](images/field_definition.png)
*Configuring the custom field properties*
![Options Field](images/options_field.png)
*Layout and positioning options*

### **Step 13: Access Layout Configuration**

1. Go to the **"Layout"** tab in your process configuration

![Layout Field](images/layout_field.png)
*Layout configuration for the work item type*
2. Click **"Add field"**

### **Step 14: Confirm Field Added**

1. Verify the field appears in the field list

![Field Added](images/field_added.png)

2. Note the reference name (e.g., "Custom.DataTableJSON")
---

## 🎛️ **Phase 4: Add Data Table Control**



### **Step 15: Add Custom Control**
![Field Added](images/field_added.png)
1. Click **"Add a custom control"**
2. This opens the control selection dialog
### **Step 16: Configure Extension Options**

This is the most important step! Configure the extension in the **Options** tab:
3. Find and select **"Custom Data Table (DataTables) v3"**
4. Click to select it
![Extension Definition](images/extension_definition.png)
*Extension definition and basic settings*

![Option Extension](images/option_extension.png)
*Options tab configuration - this is where the magic happens!*

**Configure these three options:**

1. **Data field (reference name)**: Select your custom field from dropdown
2. **Data field (manual entry)**: Backup field name entry
3. **Column Configuration (JSON)**: Your custom table structure

### **Test Case Management Template (Eg) **
```json
{
  "columns": [
    {
      "id": "testCase",
      "name": "Test Case",
      "dataType": "string",
      "required": true,
      "width": "300px"
    },
    {
      "id": "priority",
      "name": "Priority",
      "dataType": "dropdown",
      "defaultValue": "Medium",
      "options": ["Critical", "High", "Medium", "Low"]
    },
    {
      "id": "result",
      "name": "Test Result",
      "dataType": "dropdown",
      "defaultValue": "Not Run",
      "options": ["Not Run", "Passed", "Failed", "Blocked", "Skipped"]
    },
    {
      "id": "testType",
      "name": "Test Type",
      "dataType": "dropdown",
      "defaultValue": "Functional",
      "options": ["Functional", "Integration", "Unit", "Performance", "Security", "UI/UX"]
    },
    {
      "id": "tester",
      "name": "Tester",
      "dataType": "string"
    },
    {
      "id": "executionDate",
      "name": "Execution Date",
      "dataType": "date"
    },
    {
      "id": "passed",
      "name": "Passed",
      "dataType": "boolean",
      "defaultValue": false
    }
  ]
}
```
### **Step 18: Configure Layout Settings**

1. **Label**: Give your control a display name (e.g., "Task Breakdown")
2. **Page**: Choose which page to display on (usually "Details")
3. **Group**: Select or create a group for organization


![Layout Extension](images/layout_extension.png)
*Adding a custom control to the layout*





### **Step 19: Hide Field from Layout (Optional)**

If you don't want the raw field to show separately:

1. Find your custom field in the layout
2. Click **"Hide from layout"** or hide it

![Hide from Layout](images/hide_from_layout.png)
*Hiding the raw field from layout since we're using the custom control*

---

## 🏗️ **Phase 5: Create Project with New Process**

### **Step 20: Create New Project**

1. Go back to your organization main page
2. Click **"New project"**

![New Project](images/new_project.png)
*Creating a new project*

### **Step 21: Configure Project Settings**

1. **Project name**: Enter your project name
2. **Process**: Select your inherited process (e.g., "Agile with Data Tables")
3. Configure other settings as needed
4. Click **"Create"**

![New Project Dev](images/new_project_dev.png)
*Configuring new project with inherited process*

---

## 🎉 **Phase 6: Use the Extension**

### **Step 22: Create Work Item**

1. In your new project, create a new work item
2. Choose the type you configured (e.g., "User Story")

![New User Story](images/new_user_story.png)
*Creating a new User Story with the custom control*

### **Step 23: See Extension in Action**

Your custom data table control is now available! You can:

- **Add rows** with the "Add Row" button
- **Edit data** directly in the table cells
- **Delete rows** with the trash icon
- **Auto-save** - changes save automatically
- **Manual save** with the "Save to Field" button



![Full Size Extension](images/full_size_extension.png)
*The extension in full size showing all functionality*

---

## 🎨 **Column Configuration Examples**

### **Default Configuration (Basic Task Tracking)**
```json
{
  "columns": [
    {
      "id": "name",
      "name": "Item Name",
      "dataType": "string",
      "required": true
    },
    {
      "id": "estimate",
      "name": "Estimate (hrs)",
      "dataType": "number",
      "defaultValue": 0
    },
    {
      "id": "done",
      "name": "Done?",
      "dataType": "boolean",
      "defaultValue": false
    }
  ]
}
```

### **Simple Dropdown Example**
```json
{
  "columns": [
    {
      "id": "task",
      "name": "Task Name",
      "dataType": "string",
      "required": true
    },
    {
      "id": "priority",
      "name": "Priority",
      "dataType": "dropdown",
      "defaultValue": "Medium",
      "options": ["High", "Medium", "Low"]
    },
    {
      "id": "status",
      "name": "Status",
      "dataType": "dropdown",
      "defaultValue": "To Do",
      "options": ["To Do", "In Progress", "Done"]
    }
  ]
}
```

### **Project Planning Table**
```json
{
  "columns": [
    {
      "id": "feature",
      "name": "Feature Name",
      "dataType": "string",
      "required": true,
      "width": "200px"
    },
    {
      "id": "priority",
      "name": "Priority",
      "dataType": "string",
      "defaultValue": "Medium"
    },
    {
      "id": "storyPoints",
      "name": "Story Points",
      "dataType": "number",
      "defaultValue": 0
    },
    {
      "id": "assignee",
      "name": "Assigned To",
      "dataType": "string"
    },
    {
      "id": "dueDate",
      "name": "Due Date",
      "dataType": "date"
    },
    {
      "id": "completed",
      "name": "Completed",
      "dataType": "boolean",
      "defaultValue": false
    }
  ]
}
```

### **Sprint Planning Template**
```json
{
  "columns": [
    {
      "id": "story",
      "name": "User Story",
      "dataType": "string",
      "required": true,
      "width": "250px"
    },
    {
      "id": "points",
      "name": "Story Points",
      "dataType": "number",
      "defaultValue": 0
    },
    {
      "id": "assignee",
      "name": "Developer",
      "dataType": "string"
    },
    {
      "id": "status",
      "name": "Status",
      "dataType": "string",
      "defaultValue": "To Do"
    },
    {
      "id": "done",
      "name": "Complete",
      "dataType": "boolean",
      "defaultValue": false
    }
  ]
}
```

### **Test Case Management Template**
```json
{
  "columns": [
    {
      "id": "testCase",
      "name": "Test Case",
      "dataType": "string",
      "required": true,
      "width": "300px"
    },
    {
      "id": "priority",
      "name": "Priority",
      "dataType": "dropdown",
      "defaultValue": "Medium",
      "options": ["Critical", "High", "Medium", "Low"]
    },
    {
      "id": "result",
      "name": "Test Result",
      "dataType": "dropdown",
      "defaultValue": "Not Run",
      "options": ["Not Run", "Passed", "Failed", "Blocked", "Skipped"]
    },
    {
      "id": "testType",
      "name": "Test Type",
      "dataType": "dropdown",
      "defaultValue": "Functional",
      "options": ["Functional", "Integration", "Unit", "Performance", "Security", "UI/UX"]
    },
    {
      "id": "tester",
      "name": "Tester",
      "dataType": "string"
    },
    {
      "id": "executionDate",
      "name": "Execution Date",
      "dataType": "date"
    },
    {
      "id": "passed",
      "name": "Passed",
      "dataType": "boolean",
      "defaultValue": false
    }
  ]
}
```

### **Bug Tracking Template with Dropdowns**
```json
{
  "columns": [
    {
      "id": "bugTitle",
      "name": "Bug Description",
      "dataType": "string",
      "required": true,
      "width": "250px"
    },
    {
      "id": "severity",
      "name": "Severity",
      "dataType": "dropdown",
      "defaultValue": "Medium",
      "options": ["Critical", "High", "Medium", "Low"]
    },
    {
      "id": "priority",
      "name": "Priority",
      "dataType": "dropdown",
      "defaultValue": "P2",
      "options": ["P0", "P1", "P2", "P3", "P4"]
    },
    {
      "id": "status",
      "name": "Status",
      "dataType": "dropdown",
      "defaultValue": "New",
      "options": ["New", "Active", "Resolved", "Closed", "Rejected"]
    },
    {
      "id": "assignee",
      "name": "Assigned To",
      "dataType": "string"
    },
    {
      "id": "environment",
      "name": "Environment",
      "dataType": "dropdown",
      "defaultValue": "Development",
      "options": ["Development", "Testing", "Staging", "Production"]
    },
    {
      "id": "foundDate",
      "name": "Date Found",
      "dataType": "date"
    },
    {
      "id": "fixed",
      "name": "Fixed",
      "dataType": "boolean",
      "defaultValue": false
    }
  ]
}
```

### **Risk Management Template**
```json
{
  "columns": [
    {
      "id": "riskDescription",
      "name": "Risk Description",
      "dataType": "string",
      "required": true,
      "width": "250px"
    },
    {
      "id": "category",
      "name": "Category",
      "dataType": "dropdown",
      "defaultValue": "Technical",
      "options": ["Technical", "Business", "Resource", "Schedule", "Quality", "External"]
    },
    {
      "id": "probability",
      "name": "Probability",
      "dataType": "dropdown",
      "defaultValue": "Medium",
      "options": ["Very Low", "Low", "Medium", "High", "Very High"]
    },
    {
      "id": "impact",
      "name": "Impact",
      "dataType": "dropdown",
      "defaultValue": "Medium",
      "options": ["Very Low", "Low", "Medium", "High", "Very High"]
    },
    {
      "id": "riskLevel",
      "name": "Risk Level",
      "dataType": "dropdown",
      "defaultValue": "Medium",
      "options": ["Low", "Medium", "High", "Critical"]
    },
    {
      "id": "owner",
      "name": "Risk Owner",
      "dataType": "string",
      "required": true
    },
    {
      "id": "mitigation",
      "name": "Mitigation Plan",
      "dataType": "string"
    },
    {
      "id": "status",
      "name": "Status",
      "dataType": "dropdown",
      "defaultValue": "Open",
      "options": ["Open", "Mitigated", "Accepted", "Closed"]
    },
    {
      "id": "reviewDate",
      "name": "Review Date",
      "dataType": "date"
    }
  ]
}
```

### **Meeting Action Items Template**
```json
{
  "columns": [
    {
      "id": "action",
      "name": "Action Item",
      "dataType": "string",
      "required": true,
      "width": "250px"
    },
    {
      "id": "owner",
      "name": "Owner",
      "dataType": "string",
      "required": true
    },
    {
      "id": "priority",
      "name": "Priority",
      "dataType": "dropdown",
      "defaultValue": "Medium",
      "options": ["High", "Medium", "Low"]
    },
    {
      "id": "status",
      "name": "Status",
      "dataType": "dropdown",
      "defaultValue": "Not Started",
      "options": ["Not Started", "In Progress", "Blocked", "Completed", "Cancelled"]
    },
    {
      "id": "dueDate",
      "name": "Due Date",
      "dataType": "date"
    },
    {
      "id": "category",
      "name": "Category",
      "dataType": "dropdown",
      "defaultValue": "General",
      "options": ["General", "Technical", "Process", "Documentation", "Communication"]
    },
    {
      "id": "notes",
      "name": "Notes",
      "dataType": "string"
    },
    {
      "id": "completed",
      "name": "Done",
      "dataType": "boolean",
      "defaultValue": false
    }
  ]
}
```

### **Resource Planning Template**
```json
{
  "columns": [
    {
      "id": "resource",
      "name": "Resource Name",
      "dataType": "string",
      "required": true,
      "width": "200px"
    },
    {
      "id": "role",
      "name": "Role",
      "dataType": "dropdown",
      "defaultValue": "Developer",
      "options": ["Developer", "Tester", "Designer", "Analyst", "Manager", "Architect"]
    },
    {
      "id": "skillLevel",
      "name": "Skill Level",
      "dataType": "dropdown",
      "defaultValue": "Intermediate",
      "options": ["Junior", "Intermediate", "Senior", "Expert"]
    },
    {
      "id": "availability",
      "name": "Availability %",
      "dataType": "number",
      "defaultValue": 100
    },
    {
      "id": "startDate",
      "name": "Start Date",
      "dataType": "date"
    },
    {
      "id": "endDate",
      "name": "End Date",
      "dataType": "date"
    },
    {
      "id": "location",
      "name": "Location",
      "dataType": "dropdown",
      "defaultValue": "Office",
      "options": ["Office", "Remote", "Hybrid", "Client Site"]
    },
    {
      "id": "allocated",
      "name": "Allocated",
      "dataType": "boolean",
      "defaultValue": false
    }
  ]
}
```

### **Feature Requirements Template**
```json
{
  "columns": [
    {
      "id": "requirement",
      "name": "Requirement",
      "dataType": "string",
      "required": true,
      "width": "300px"
    },
    {
      "id": "type",
      "name": "Type",
      "dataType": "dropdown",
      "defaultValue": "Functional",
      "options": ["Functional", "Non-Functional", "Business", "Technical", "Compliance"]
    },
    {
      "id": "priority",
      "name": "Priority",
      "dataType": "dropdown",
      "defaultValue": "Medium",
      "options": ["Must Have", "Should Have", "Could Have", "Won't Have"]
    },
    {
      "id": "complexity",
      "name": "Complexity",
      "dataType": "dropdown",
      "defaultValue": "Medium",
      "options": ["Simple", "Medium", "Complex", "Very Complex"]
    },
    {
      "id": "status",
      "name": "Status",
      "dataType": "dropdown",
      "defaultValue": "Draft",
      "options": ["Draft", "Review", "Approved", "In Development", "Testing", "Done"]
    },
    {
      "id": "owner",
      "name": "Owner",
      "dataType": "string"
    },
    {
      "id": "estimatedEffort",
      "name": "Estimated Effort (hrs)",
      "dataType": "number",
      "defaultValue": 0
    },
    {
      "id": "targetDate",
      "name": "Target Date",
      "dataType": "date"
    }
  ]
}
```

---

## 📖 **Column Configuration Reference**

### **Required Properties**
| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `id` | string | Unique identifier for the column | `"taskName"` |
| `name` | string | Display name shown in table header | `"Task Name"` |
| `dataType` | string | Input type for the column | `"string"` |

### **Optional Properties**
| Property | Type | Description | Default | Example |
|----------|------|-------------|---------|---------|
| `required` | boolean | Whether the field must be completed | `false` | `true` |
| `defaultValue` | any | Default value for new rows | depends on type | `"New Task"` |
| `width` | string | Column width (CSS format) | Auto | `"220px"` |
| `options` | string[] | Required only for `dropdown` | `[]` | `["High","Medium","Low"]` |

### **Supported Data Types**
| Data Type | Input Control | Description | Example Values |
|-----------|---------------|-------------|----------------|
| `string` | Text input | Single-line text | `"Task description"` |
| `textArea` | Text area | Multi-line text | `"Detailed change plan..."` |
| `number` | Number input | Integers or decimals | `42`, `3.14` |
| `boolean` | Checkbox | True/false values | `true`, `false` |
| `date` | Date & time picker | Stores a local `yyyy-MM-ddTHH:mm` value | `"2026-03-15T21:30"` |
| `dropdown` | Select dropdown | Predefined list of options | `"High"`, `"Medium"`, `"Low"` |

### **Basic Example**
```json
{
  "columns": [
    {
      "id": "descripcion",
      "name": "Descripción",
      "dataType": "textArea",
      "required": true,
      "width": "300px"
    },
    {
      "id": "responsable",
      "name": "Responsable",
      "dataType": "string",
      "required": true,
      "width": "200px"
    },
    {
      "id": "fechaInicio",
      "name": "Fecha y hora inicio",
      "dataType": "date",
      "required": true,
      "width": "220px"
    },
    {
      "id": "fechaFin",
      "name": "Fecha y hora fin",
      "dataType": "date",
      "required": true,
      "width": "220px"
    }
  ]
}
```

### **Dropdown Configuration**
For dropdown columns, you must include an `options` array:

```json
{
  "id": "priority",
  "name": "Priority",
  "dataType": "dropdown",
  "defaultValue": "Medium",
  "options": ["High", "Medium", "Low"]
}
```

### **Optional Validation Rules**
By default, the extension only validates columns marked with `required: true` and shows the red message **"Debe completar todos los campos"** when one or more required fields are empty.

If you need date comparison logic, add a top-level `rules` array. Example:

```json
{
  "columns": [
    {
      "id": "fechaInicio",
      "name": "Fecha y hora inicio",
      "dataType": "date",
      "required": true
    },
    {
      "id": "fechaFin",
      "name": "Fecha y hora fin",
      "dataType": "date",
      "required": true
    }
  ],
  "rules": [
    {
      "type": "dateOrder",
      "startColumnId": "fechaInicio",
      "endColumnId": "fechaFin",
      "message": "La fecha inicial debe ser menor que la fecha final"
    }
  ]
}
```

### **Important Notes**
- The table is created dynamically from the `columns` array.
- `textArea` is supported as an additional configurable type for multi-line content.
- `options` is **required** for `dropdown` columns.
- The red validation message disappears automatically when all required fields are valid.
- Date order validation is now **optional** and only runs when you define a `dateOrder` rule.

---

## 🐛 **Troubleshooting**

### **Understanding Status Messages**

The extension shows helpful status messages in the top-right corner:

| Status | Meaning | Action Needed |
|--------|---------|---------------|
| `"Ready"` | ✅ Working correctly | None |
| `"Pending changes…"` | 🔄 Auto-saving in progress | Wait for save |
| `"Saved"` | ✅ Manual save completed | None |
| `"⚠️ Field not found/writable"` | ❌ Configuration issue | Check field setup |
| `"Error while updating field"` | ❌ Save failed | Check debug panel |

### **Common Issues & Solutions**

#### **"No configuration is needed for this control extension"**
- **Cause**: Extension manifest issue or caching
- **Solution**: Clear browser cache, refresh page, or contact admin

#### **"Field not found/writable"**
- **Cause**: Custom field doesn't exist or has wrong permissions
- **Solution**: 
  1. Verify custom field exists in process configuration
  2. Check field type is String, PlainText, or HTML
  3. Ensure field is added to the work item type

#### **"Invalid column configuration JSON"**
- **Cause**: Malformed JSON in configuration
- **Solution**: 
  1. Validate JSON syntax using online JSON validator
  2. Check all required properties are present
  3. Use provided examples as templates

#### **Data not saving**
- **Cause**: Field permissions or validation issues
- **Solution**:
  1. Check debug panel for error messages
  2. Verify field is not read-only
  3. Ensure user has edit permissions on work item

### **Quick Diagnostic Checklist**

When something isn't working:

1. ✅ **Check Field Configuration**: Ensure custom field exists and is accessible
2. ✅ **Validate JSON**: Use online JSON validator to check configuration syntax
3. ✅ **Check Permissions**: Ensure user can edit the work item and field
4. ✅ **Browser Console**: Check for JavaScript errors in developer tools
5. ✅ **Clear Cache**: Try incognito/private browsing mode
6. ✅ **Process Assignment**: Verify project is using the correct inherited process

---

## 🎯 **Best Practices**

### **Column Design Guidelines**
1. **Keep IDs Simple**: Use camelCase, no spaces (`taskName` not `Task Name`)
2. **Meaningful Names**: Use clear, descriptive column names users will understand
3. **Appropriate Types**: Choose the right data type for each column
4. **Required Fields**: Mark essential columns as required, but don't overdo it
5. **Default Values**: Provide sensible defaults to speed up data entry
6. **Column Width**: Set widths for important columns to ensure good layout

### **Performance Considerations**
1. **Column Count**: Keep under 10 columns for optimal performance
2. **Data Volume**: Tested with 100+ rows, works well for typical use cases
3. **Field Type**: Use `Text (multiple lines)` rather than `HTML` when possible

### **User Experience Tips**
1. **Logical Order**: Arrange columns in the order users will fill them
2. **Consistent Naming**: Use consistent terminology across your organization
3. **Help Documentation**: Document your configurations for team members
4. **Training**: Provide brief training on how to use the tables effectively

---

## 🆘 **Support & Resources**

### **What's New in v8.3.39**

- ✨ **Dynamic Column Configuration**: Fully customizable table columns
- 🐛 **Fixed Options Panel**: Configuration now shows correctly
- 🔧 **Clean User Interface**: Debug information hidden by default
- 🛡️ **Improved Data Migration**: Seamless upgrade from previous versions
- 📱 **Better Mobile Support**: Responsive design improvements

### **Getting Help**

1. **Status Messages**: Read status messages for quick diagnostics
2. **Browser Console**: Check browser developer tools for errors
3. **Documentation**: Refer to this guide and examples
4. **JSON Validation**: Use online JSON validators for configuration

---

**🎉 Congratulations! You now have a fully functional Dynamic Data Table Extension in your Azure DevOps organization!**

Your teams can now create powerful, customized data tables for any work item type, making project management, sprint planning, and task tracking more efficient and organized.

![Success](images/full_size_extension.png)
*Your Dynamic Data Table Extension is ready to transform your Azure DevOps experience!*