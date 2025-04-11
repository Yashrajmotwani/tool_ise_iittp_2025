import Parser = require("tree-sitter");
import Cpp = require("tree-sitter-cpp");

export function analyzeComplexityAST(code: string): string {
    const parser = new Parser();
    parser.setLanguage(Cpp);

    const tree = parser.parse(code);
    const rootNode = tree.rootNode;

    const functionNodes = getFunctionDefinitions(rootNode);

    const functionData = functionNodes.map(node => {
        const nameNode = node.childForFieldName("declarator")?.child(0);
        const funcName = nameNode?.text || "unknown";
        const { isRecursive, divideCount, subtractCount } = analyzeRecursion(node, funcName);
        return { name: funcName, maxLoopDepth: 0, isRecursive, divideCount, subtractCount };
    });

    let overallLoop = { exp: 0, log: 0 };
    for (const funcNode of functionNodes) {
        const comp = getLoopComplexity(funcNode);
        if (compareComplexity(comp, overallLoop) > 0) {
            overallLoop = comp;
        }
    }
    const loopComplex = complexityToString(overallLoop);
    const recComplex = getRecursiveComplexity(functionData);

    return combineComplexities(loopComplex, recComplex);
}

function getFunctionDefinitions(root: Parser.SyntaxNode): Parser.SyntaxNode[] {
    const functions: Parser.SyntaxNode[] = [];
    const visit = (node: Parser.SyntaxNode) => {
        if (node.type === "function_definition") {
            functions.push(node);
        }
        for (let i = 0; i < node.namedChildCount; i++) {
            const child = node.namedChild(i);
            if (child) visit(child);
        }
    };
    visit(root);
    return functions;
}

function isLogLoop(node: Parser.SyntaxNode): boolean {
    // Detect if a loop runs in logarithmic time (halving/doubling pattern)
    if (node.type === "for_statement") {
        const updateNode = node.childForFieldName("update");
        if (updateNode) {
            const updateText = updateNode.text.replace(/\s+/g, "");
            if (updateText.match(/(\*=|\/=|<<=|>>=)/)) {
                return true;
            }
            if (updateText.match(/^([A-Za-z_]\w*)=\1[*/]/)) {
                return true;
            }
            if (updateText.match(/^([A-Za-z_]\w*)=\1<<\d/) || updateText.match(/^([A-Za-z_]\w*)=\1>>\d/)) {
                return true;
            }
        }
        // If no update or no multiplicative update, fall through to check condition/body
    }
    const condNode = node.childForFieldName("condition") ||
        (node.type === "do_statement" ? node.namedChild(1) : null);
    const bodyNode = node.childForFieldName("body") ||
        (node.type === "do_statement" ? node.namedChild(0) :
            node.type === "while_statement" ? node.namedChild(node.namedChildCount - 1) :
                node.type === "for_statement" ? node.namedChild(node.namedChildCount - 1) : null);
    if (!condNode) {
        return false;
    }
    // Gather identifiers in loop condition
    const ids: Set<string> = new Set();
    const collectIds = (n: Parser.SyntaxNode) => {
        if (!n) return;
        if (n.type === "identifier") {
            ids.add(n.text);
        }
        for (let i = 0; i < n.namedChildCount; i++) {
            const child = n.namedChild(i);
            if (child) collectIds(child);

        }
    };
    collectIds(condNode);
    const idList = Array.from(ids);
    if (idList.length >= 2) {
        // If two variables control the loop (e.g., low and high for binary search), check for halving in body
        if (bodyNode && (bodyNode.text.match(/\/\s*2/) || bodyNode.text.match(/>>\s*1/))) {
            return true;
        }
        return false;
    } else if (idList.length === 1) {
        const varName = idList[0];
        let foundLog = false;
        if (bodyNode) {
            const scanNode = (n: Parser.SyntaxNode) => {
                if (!n) return;
                if (n.type === "assignment_expression" || n.type === "update_expression") {
                    const text = n.text.replace(/\s+/g, "");
                    if (n.type === "assignment_expression") {
                        const target = n.child(0);
                        if (target && target.type === "identifier" && target.text === varName) {
                            if (text.match(/(\*=|\/=|<<=|>>=)/) || text.match(/=[^=]*[*/]/) || text.match(/=[^=]*<<|=[^=]*>>/)) {
                                foundLog = true;
                                return;
                            }
                            if (text.match(/(\+=|-=)/) || text.match(/=[^=]*[+-]/)) {
                                // Linear increment/decrement update
                                return;
                            }
                        }
                    } else if (n.type === "update_expression") {
                        if (text.startsWith(varName) || text.endsWith(varName)) {
                            if (text.includes("++") || text.includes("--")) {
                                // Linear increment/decrement
                                return;
                            }
                        }
                    }
                }
                for (let j = 0; j < n.namedChildCount; j++) {
                    const child = n.namedChild(j);
                    if (child) scanNode(child);

                }
            };
            scanNode(bodyNode);
        }
        return foundLog;
    }
    return false;
}

function compareComplexity(a: { exp: number, log: number }, b: { exp: number, log: number }): number {
    if (a.exp !== b.exp) {
        return a.exp > b.exp ? 1 : -1;
    }
    if (a.log !== b.log) {
        return a.log > b.log ? 1 : -1;
    }
    return 0;
}

function complexityToString(comp: { exp: number, log: number }): string {
    const { exp, log } = comp;
    if (exp === 0 && log === 0) {
        return "O(1)";
    }
    const parts: string[] = [];
    if (exp > 0) {
        parts.push(exp === 1 ? "n" : `n^${exp}`);
    }
    if (log > 0) {
        parts.push(log === 1 ? "log n" : `(log n)^${log}`);
    }
    return `O(${parts.join(" ")})`;
}

function getLoopComplexity(node: Parser.SyntaxNode): { exp: number, log: number } {
    if (!node) {
        return { exp: 0, log: 0 };
    }
    if (["for_statement", "while_statement", "do_statement"].includes(node.type)) {
        const logLoop = isLogLoop(node);
        const current = { exp: logLoop ? 0 : 1, log: logLoop ? 1 : 0 };
        const bodyNode = node.childForFieldName("body") ||
            (node.type === "do_statement" ? node.namedChild(0) :
                node.type === "while_statement" ? node.namedChild(node.namedChildCount - 1) :
                    node.type === "for_statement" ? node.namedChild(node.namedChildCount - 1) : null);
        const innerComp = bodyNode ? getLoopComplexity(bodyNode) : { exp: 0, log: 0 };

        return { exp: current.exp + innerComp.exp, log: current.log + innerComp.log };
    } else {
        let maxComp = { exp: 0, log: 0 };
        for (let i = 0; i < node.namedChildCount; i++) {
            const child = node.namedChild(i);
            if (!child) continue;
            const comp = getLoopComplexity(child);

            if (compareComplexity(comp, maxComp) > 0) {
                maxComp = comp;
            }
        }
        return maxComp;
    }
}

function analyzeRecursion(funcNode: Parser.SyntaxNode, funcName: string) {
    let isRecursive = false;
    let divideCount = 0;
    let subtractCount = 0;

    const halfVars = new Set<string>();
    const subtractVars = new Set<string>();

    function walk(node: Parser.SyntaxNode) {
        if ((node.type === "assignment_expression" || node.type === "init_declarator") && node.childCount >= 2) {
            const targetNode = node.child(0);
            const valueNode = node.child(node.childCount - 1);
            if (targetNode && targetNode.type === "identifier" && valueNode) {
                const varName = targetNode.text;
                if (valueNode.text.match(/\/\s*2\b/) || valueNode.text.match(/>>\s*1\b/)) {
                    halfVars.add(varName);
                } else if (valueNode.type === "binary_expression" && valueNode.text.match(/\- *\d+\b/)) {
                    const [left, right] = [valueNode.child(0), valueNode.child(2)];
                    if (left && left.type === "identifier" && right && right.type === "number_literal") {
                        subtractVars.add(varName);
                    }
                }
            }
        }

        if (node.type === "call_expression") {
            const ident = node.child(0);
            if (ident && ident.type === "identifier" && ident.text === funcName) {
                isRecursive = true;
                const argsNode = node.childForFieldName("arguments") || node.childForFieldName("argument_list");
                if (argsNode) {
                    for (let i = 0; i < argsNode.namedChildCount; i++) {
                        const arg = argsNode.namedChild(i);
                        if (!arg) continue;
                        const argText = arg.text.replace(/\s+/g, "");
                        if (argText.match(/\/2$/) || argText.match(/>>1$/)) {
                            divideCount++;
                            continue;
                        }
                        if (arg.type === "identifier") {
                            const name = arg.text;
                            if (halfVars.has(name)) {
                                divideCount++;
                                continue;
                            }
                            if (subtractVars.has(name)) {
                                subtractCount++;
                                continue;
                            }
                        }
                        if (arg.type === "binary_expression") {
                            const left = arg.child(0), right = arg.child(arg.childCount - 1);
                            const opText = argText;
                            if (opText.includes("/2")) {
                                divideCount++;
                                continue;
                            }
                            if (left && right) {
                                if (right.type === "number_literal" && halfVars.has(left.text) && opText.match(/[\+\-]\d+$/)) {
                                    divideCount++;
                                    continue;
                                }
                                if (right.type === "number_literal" && left.type === "identifier" && opText.includes("-") && !opText.includes("/")) {
                                    subtractCount++;
                                    continue;
                                }
                            }
                        }
                    }
                }
            }
        }
        for (let i = 0; i < node.namedChildCount; i++) {
            const child = node.namedChild(i);
            if (child) walk(child);
        }
    }
    walk(funcNode);
    return { isRecursive, divideCount, subtractCount };
}

function getRecursiveComplexity(functions: {
    name: string;
    maxLoopDepth: number;
    isRecursive: boolean;
    divideCount: number;
    subtractCount: number;
}[]): string {
    let maxDivide = 0, maxSubtract = 0;
    for (const func of functions) {
        if (!func.isRecursive) continue;
        if (func.divideCount > maxDivide) maxDivide = func.divideCount;
        if (func.subtractCount > maxSubtract) maxSubtract = func.subtractCount;
    }

    if (maxDivide >= 2) return "O(n log n)";
    if (maxDivide === 1) return "O(log n)";
    if (maxSubtract >= 3) return "O(3^n)";
    if (maxSubtract === 2) return "O(2^n)";
    if (maxSubtract === 1) return "O(n)";
    return "O(1)";
}

function combineComplexities(c1: string, c2: string): string {
    if (c1 === "O(1)") return c2;
    if (c2 === "O(1)") return c1;
    if (c1 === c2) return c1;
    if ((c1 === "O(n)" && c2 === "O(log n)") || (c2 === "O(n)" && c1 === "O(log n)")) {
        return "O(n log n)";
    }
    return `O(${c1.replace("O(", "").replace(")", "")} * ${c2.replace("O(", "").replace(")", "")})`;
}
