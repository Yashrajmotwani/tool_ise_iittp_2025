# ISE TOOL PROJECT 2025

## Introduction

Our aim to to create a Code Review Checklist to help developers create better quality code which is maintainable. We are showing refactoring suggestions to improve code quality by detecting code smells. We are also finding the code complexity and displaying the heatmap. Additionally we are finding code emotions and showing dynamic emoji-based feedback.


## Installation Requirements

1. This extension uses **Lizard** for complexity analysis. Make sure Python and Lizard are installed:

```
pip install lizard
```

2. Search 

> Code Review Helper or Code Review IIT 
 
to find our Extension on VS Code Extensions. Click on install.

3. To run and use extension on a Particular File:

> Ctrl + Shift + P



## Features

### 1. CodeEmotion

This feature provides an interactive and visual way to enhance the C/C++ code analysis by adding emoji decorations based on specific code patterns. It helps highlight common issues, patterns, and optimizations with fun and informative emojis!

#### Code Emotion Features

- 💡 **Code Pattern Emojis**: Adds emojis to indicate patterns such as too many `if` statements, nested loops, large `switch` statements, and more.
- 🚫 **Missing Semicolons Detection**: Flags missing semicolons at the end of statements in C/C++ code.
- ⚠️ **Trailing Whitespace Detection**: Flags trailing whitespaces in your code to help maintain cleaner formatting.
- 🧑‍💻 **Well-Structured Code**: Highlights well-structured control flows like `if`, `for`, and `while` statements, and encourages the use of modern C++ constructs like `unique_ptr` and `shared_ptr`.
- 📝 **Clear Comments**: Adds emojis to single-line comments to remind developers to maintain and update comments when code changes.


#### Emoji Patterns

The extension detects and decorates your code based on various patterns:

- `💩`: Too many `if-else` statements.
- `🌀`: Large `switch` statements (3+ cases).
- `🔁`: Nested loops detected.
- `🌟`: Well-structured control flow.
- `⚡`: Performance optimization through `return`, `break`, or `continue`.
- `👍`: Well-designed void functions.
- `🧪`: Google Test macros or related test functions.
- `✅`: Google Test assertions.
- `🛡️`: Proper error handling using `try/catch`.
- `🔮`: Use of constants instead of magic numbers.
- `🧵`: Template literals usage in place of string concatenation.
- `🏹`: Function pointer usage in C/C++.
- `λ`: Lambda functions in C++.
- `🧠`: Smart pointer usage (e.g., `unique_ptr`, `shared_ptr`, `weak_ptr`).
- `🧪`: Catch2 test macros.


#### Supported Languages

This extension is designed specifically for C and C++ files.

- **C** (🔧)
- **C++** (🔧)


### 2. Cyclomatic Complexity Heatmap

This feature helps developers analyze code complexity and improve code quality with a **visual heatmap overlay**.

#### Complexity Features

- 🧠 **Cyclomatic Complexity Analysis** using [Lizard](https://github.com/terryyin/lizard)
- 🎨 **Color-coded Heatmap** overlay on functions based on complexity
- ✅ **Toggle Heatmap** ON/OFF dynamically via command
- 🔍 **Function-level Analysis Panel** with webview showing detailed complexity info
<!-- - 🛠️ **Refactor suggestions** for C/C++ files based on basic code patterns -->


#### Heatmap Colors
The heatmap uses a gradient from **green (low complexity)** to **red (high complexity)**:

| Complexity Score | Color  | Meaning              |
|------------------|--------|----------------------|
| 1–5              | 🟢 Green  | Low complexity       |
| 6–10             | 🟡 Yellow | Moderate complexity  |
| 11–15            | 🟠 Orange | High complexity      |
| 16–25            | 🔴 Red    | Very high complexity |

#### How Heatmap Toggle Works
When toggled **ON**, the extension:

- Clears any previous decorations ✨
- Runs Lizard analysis again 🧑‍💻
- Applies new heatmap overlays based on updated complexity 🔥

When toggled **OFF**, it clears the decorations without deleting the stored analysis 🧹.

When switching between files, the heatmap auto-applies if it was visible previously 🔄.

#### Supported Languages
Works with major languages supported by Lizard, including:

- C, C++ 🔧
- Java ☕
- Python 🐍
- C# 🔶
- JavaScript
- Go 🌍, Kotlin 🟢, Swift 🍏, Rust ⚙️, Ruby 💎, Scala ⚛️.

### 3. Refactoring Suggestions


## 


## Work Distribution
**Sai Jagadeesh (CS24M101)**

 - Dynamic Code Complexity Analysis
 - Dynamic Toggle heatmap
 - Color to Complexity mapping
 - Maintaining heatmap state for multiple files

**Yashraj Motwani (CS24M104)**

 - Dynamic Code Emotions 
 - Feature Integration
 - Webview Panel and UI
 - Progress bar and Tasks handling

**Tejas Meshram (CS24M108)**

 - Refactoring Suggestions using Regex
 - Refresh button for Tasks
 - Add to VS Code Marketplace
