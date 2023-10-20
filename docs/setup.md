| [Home](../README.md) |
|----------------------|

# Installation

1. To install a widget, click **Content Hub** > **Discover**.
2. From the list of widget that appears, search for and select **Funnel Chart**.
3. Click the card of the **Funnel Chart** widget.
4. Click **Install** on the bottom to begin installation.

# Configuration

## Funnel Chart Widget Settings

### Data Source Selection

| Fields             | Description                                                                            |
|--------------------|----------------------------------------------------------------------------------------|
| Title              | Specify the heading or title of the visual depiction of each record node in the group. |
| Select Data Source | Populate the records with FortiSOAR&trade; modules or data from a single custom module |

### Record Containing JSON Data

| Fields                                     | Description                                                                                                                                                                     |
|--------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Data Source                                | Select the custom module from which to fetch the data                                                                                                                           |
| Filter Record Which Contains The JSON Data | Add conditions to retrieve only the record meeting the filter conditions. If multiple records match the conditions given, the first record is considered.                       |
| Select Field                               | Select the field(Column) of the module which contains the `JSON` data                                                                                                           |
| Title                                      | Enter the title of the layer to display on the widget                                                                                                                           |
| Value                                      | Considering the data is `JSON`, enter a `key` to display its corresponding `value` on a layer                                                                                   |
| Add Layer                                  | Adds a new layer to the funnel chart widget. At least **one layer is mandatory**. You can append more layers or even delete a layer. You can have a maximum of **four** layers. |
**Advanced Settings**
| Update Content On Receiving Event | Toggle button to enable or disable the Event Listning |
| Event Name | Enter the event name, the event name should be similar to the event name mentioned in  the broadcasting widget |

### Count of Records Across Modules

| Fields          | Description                                                                                                                                                                     |
|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Title           | Enter the title for the layer to display on the widget                                                                                                                          |
| Data Source     | Select the module to display its record count                                                                                                                                   |
| Filter Criteria | Add conditions to retrieve the count of records meeting the filter conditions.                                                                                                  |
| Add Layer       | Adds a new layer to the funnel chart widget. At least **one layer is mandatory**. You can append more layers or even delete a layer. You can have a maximum of **four** layers. |

| [Usage](./usage.md) |
|---------------------|