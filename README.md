# VS Code Complexity Visualizer Extension

This VS Code extension integrates static code analysis using **Lizard** to visualize cyclomatic complexity of code. It overlays a heatmap directly on the editor to highlight areas of code with different complexity levels, helping developers identify complex functions easily. Additionally, the extension includes a WebView panel to display cyclomatic complexity and NLOC in an interactive table.

## Features

- **Heatmap Overlay**: Visualizes code complexity in the editor with color-coded highlights:
  - Green: Low complexity 
  - Yellow: Medium complexity 
  - Red: High complexity 
  
- **WebView Panel**: Displays a table with the following data:
  - **Line Numbers (Range)**: Start and end line numbers of each function.
  - **Function Name**: Name of the function.
  - **NLOC**: Lines of Code in the function.
  - **Cyclomatic Complexity**: Calculated cyclomatic complexity score.
  - **Color Representation**: Color assigned based on complexity score.

- **Toggle Heatmap**: Easily toggle the visibility of the heatmap overlay with the button in the WebView.

## Usage

1. Open a supported code file list given in below table.
2. Use the **Analyze Complexity** command from the Command Palette (`Ctrl+Shift+P`).
3. The extension will run Lizard and display complexity data:
   - The editor will show a heatmap with color-coded complexity scores.
   - The WebView will display a detailed table of function complexities.
4. Toggle the heatmap visibility using the toggle button in the WebView panel.

💡 **Hover Tooltips**  
  Hover over any colored region to instantly view the **cyclomatic complexity score** of the function.

## ✅ Lizard Supported Languages

| Language Name | Common File Extensions       |
|---------------|------------------------------|
| C/C++         | `.c`, `.cpp`, `.cc`, `.h`    |
| Java          | `.java`                      |
| C#            | `.cs`                        |
| JavaScript    | `.js`                        |
| TypeScript    | `.ts`                        |
| Python        | `.py`                        |
| Objective-C   | `.m`, `.mm`                  |
| Swift         | `.swift`                     |
| Ruby          | `.rb`                        |
| Scala         | `.scala`                     |
| Go            | `.go`                        |
| Kotlin        | `.kt`, `.kts`                |
| Rust          | `.rs`                        |



📊 **General Cyclomatic Complexity Ranges** (based on Lizard and industry norms)

| Score Range | Complexity Level | Description                                            |
|-------------|------------------|--------------------------------------------------------|
| 1–5         | Low              | Simple, easy to understand and test                   |
| 6–10        | Moderate         | Manageable, but may benefit from simplification       |
| 11–20       | High             | Complex, harder to test, consider refactoring         |
| 21–50       | Very High        | Very complex, likely needs major refactoring          |
| > 50        | Extreme          | Unmaintainable, high risk for bugs                    |


## Credits

- **Lizard**: The cyclomatic complexity analyzer used in this extension.
