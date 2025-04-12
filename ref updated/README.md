# C++ Refactor Helper
 code smells and provides actionable refactoring suggestions.

---

## 🚀 Features

- **Smart C++ Code Analysis**
  - Detects common refactoring opportunities like:
    - Long functions
    - Magic numbers
    - Nested loops
    - Duplicate code
    - Long parameter lists
    - Deep nesting
    - Temporary variables

- **Selective Analysis**
  - Analyze **only selected code** or the **entire file** if nothing is selected.

- **Webview Report**
  - A clean sidebar opens with a list of detected refactoring opportunities and links to learn more.

- **Built-in Documentation Links**
  - Each suggestion comes with curated links to articles or documentation.


---



## 🔍 Refactoring Patterns & Resources

| Pattern Name           | Description                                                                 | Resources |
|------------------------|-----------------------------------------------------------------------------|-----------|
| **Extract Method**     | Function is too long or does too much. Break it into smaller functions.     | [Refactoring Guru](https://refactoring.guru/extract-method) · [Microsoft Docs](https://learn.microsoft.com/en-us/visualstudio/ide/refactoring-extract-method) · [Wikipedia](https://en.wikipedia.org/wiki/Extract_method) |
| **Replace Temp**       | Temporary variables used only once. Inline them with expressions.           | [Refactoring Guru](https://refactoring.guru/replace-temp-with-query) · [Medium](https://medium.com/swlh/replace-temp-with-query-d9ac01770e2b) |
| **Duplicate Code**     | Repeated logic. Extract it into shared functions.                           | [Wikipedia](https://en.wikipedia.org/wiki/Duplicate_code) · [Medium](https://medium.com/swlh/eliminate-duplicate-code-985b5c7e3e64) |
| **Nested Loops**       | Multiple loops inside one another. May need simplifying.                    | [StackOverflow](https://stackoverflow.com/questions/22887259/how-to-avoid-nested-loops-in-c) |
| **Magic Numbers**      | Numbers without named constants. Replace with `const` or `#define`.         | [Wikipedia](https://en.wikipedia.org/wiki/Magic_number_(programming)) |
| **Long Parameter List**| Functions with many parameters. Group related parameters into structs.      | [Refactoring Guru](https://refactoring.guru/replace-parameter-with-object) |
| **Deep Nesting**       | Excessive nesting of blocks makes code harder to follow.                    | [Medium](https://medium.com/@cramforce/avoiding-too-deep-nesting-in-code-e5b14e314d7e) |

---


## 🛠 Command
`Cpp Refactor Helper: Analyze Function`  
_Run it via command palette or bind it to a keyboard shortcut._





