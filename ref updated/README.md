# C++ Refactor Helper
Code smells and provides actionable refactoring suggestions.

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
| **Extract Method**     | Function is too long or does too much. Break it into smaller functions.     | [Refactoring Guru](https://refactoring.guru/extract-method) · [Dev.to](https://dev.to/tkarropoulos/extract-method-refactoring-gn5) |
| **Replace Temp**       | Temporary variables used only once. Inline them with expressions.           | [Refactoring Guru](https://refactoring.guru/replace-temp-with-query) · [C2 Wiki](https://wiki.c2.com/?ReplaceTempWithQuery) |
| **Duplicate Code**     | Repeated logic. Extract it into shared functions.                           | [CodeAnt AI](https://www.codeant.ai/blogs/refactor-duplicate-code-examples) · [Refactoring Guru](https://refactoring.guru/smells/duplicate-code) |
| **Nested Loops**       | Multiple loops inside one another. May need simplifying.                    | [Medium](https://juliuskoronci.medium.com/the-evil-nested-for-loop-9fbc2f999ec1) |
| **Magic Numbers**      | Numbers without named constants. Replace with `const` or `#define`.         | [Wikipedia](https://en.wikipedia.org/wiki/Magic_number_(programming)) · [Refactoring Guru](https://refactoring.guru/replace-magic-number-with-symbolic-constant) |
| **Long Parameter List**| Functions with many parameters. Group related parameters into structs.      | [StackOverflow](https://stackoverflow.com/questions/439574/whats-the-best-way-to-refactor-a-method-that-has-too-many-6-parameters) · [CodeSignal](https://codesignal.com/learn/courses/refactoring-by-leveraging-your-tests-with-csharp-xunit/lessons/long-parameter-list-introduce-parameter-object) |
| **Deep Nesting**       | Excessive nesting of blocks makes code harder to follow.                    | [Medium](https://shuhanmirza.medium.com/two-simple-methods-to-refactor-deeply-nested-code-78eb302bb0b4#:~:text=Deeply%20nested%20code%20can%20often,them%20into%20their%20own%20functions.) |

---

## 🛠 Command
`Cpp Refactor Helper: Analyze Function`  
_Run it via command palette or bind it to a keyboard shortcut._
