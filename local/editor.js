import { EditorView, basicSetup } from "codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import Linter from "eslint4b-prebuilt";
import { linter } from "@codemirror/lint";
import { snippetCompletion } from "@codemirror/autocomplete";
import * as commands from "@codemirror/commands";
import { javascript, esLint } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { rust } from "@codemirror/lang-rust";
import { sql } from "@codemirror/lang-sql";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { go } from "@codemirror/lang-go";
import { markdown } from "@codemirror/lang-markdown";
import { php } from "@codemirror/lang-php";

/**
 * language: "python" | "javascript" | "cpp" | "java" | "go" | "rust" | "html" | "css" | "sql" | "json"
 */
export function customLinter(language) {
  return linter((view) => {
    const diagnostics = [];
    const doc = view.state.doc;
    const lines = doc.toString().split("\n");

    let offset = 0;
    let sawTabs = false;
    let sawSpaces = false;

    for (let lineNo = 0; lineNo < lines.length; lineNo++) {
      const line = lines[lineNo];
      const from = offset;
      const to = offset + line.length;

      /* ---------------- UNIVERSAL RULES ---------------- */

      if (/\s+$/.test(line)) {
        diagnostics.push({
          from: Math.max(from, to - 1),
          to,
          severity: "warning",
          message: "Trailing whitespace",
        });
      }

      if (/^\t+/.test(line)) sawTabs = true;
      if (/^ +/.test(line)) sawSpaces = true;

      if (/\t/.test(line)) {
        diagnostics.push({
          from,
          to,
          severity: "warning",
          message: "Tab character found, use spaces",
        });
      }

      const maxLen = language === "markdown" ? 100 : 120;
      if (line.length > maxLen) {
        diagnostics.push({
          from: from + maxLen,
          to,
          severity: "info",
          message: `Line exceeds ${maxLen} characters`,
        });
      }

      if (/(TODO|FIXME)/.test(line)) {
        diagnostics.push({
          from,
          to,
          severity: "info",
          message: "TODO/FIXME found",
        });
      }

      /* ---------------- LANGUAGE-SPECIFIC ---------------- */

      switch (language) {
        case "python": {
          if (!/^\s*#/.test(line)) {
            const stripped = line.replace(
              /("""[\s\S]*?"""|'''[\s\S]*?'''|(["'])(?:\\.|[^\\])*?\2)/g,
              ""
            );

            if (/\bprint\s*\(/.test(stripped)) {
              diagnostics.push({
                from,
                to,
                severity: "info",
                message: "print() found (debug code?)",
              });
            }
          }

          if (/^\s+/.test(line) && /\t/.test(line)) {
            diagnostics.push({
              from,
              to,
              severity: "error",
              message: "Mixed indentation (tabs + spaces)",
            });
          }
          break;
        }

        case "javascript":
          if (/console\.(log|debug)/.test(line)) {
            diagnostics.push({
              from,
              to,
              severity: "warning",
              message: "console.log/debug found",
            });
          }
          if (
            line.trim() &&
            !line.trim().endsWith(";") &&
            /[a-zA-Z0-9_]$/.test(line.trim())
          ) {
            diagnostics.push({
              from: Math.max(from, to - 1),
              to,
              severity: "info",
              message: "Possible missing semicolon",
            });
          }
          break;

        case "cpp":
        case "java":
        case "php": {
          // Ignore full-line comments
          if (/^\s*\/\//.test(line) || /^\s*\/\*/.test(line)) break;

          // Strip strings
          let stripped = line.replace(/(["'])(?:\\.|[^\\])*?\1/g, "");

          // Strip inline comments
          stripped = stripped.replace(/\/\/.*$/, "");
          stripped = stripped.replace(/\/\*.*?\*\//g, "");

          if (!stripped.trim()) break;

          // ✅ FIX: exclude function calls from semicolon rule
          if (
            !stripped.trim().endsWith(";") &&
            /[a-zA-Z0-9_]$/.test(stripped.trim())
          ) {
            diagnostics.push({
              from: Math.max(from, to - 1),
              to,
              severity: "info",
              message: "Statement may require semicolon",
            });
          }

          // Debug printf detection
          if (/\bprintf\s*\(/.test(stripped)) {
            diagnostics.push({
              from,
              to,
              severity: "info",
              message: "printf() found (debug output?)",
            });
          }
          break;
        }

        case "go":
          if (/fmt\.Print/.test(line)) {
            diagnostics.push({
              from,
              to,
              severity: "info",
              message: "fmt.Print found (debug output?)",
            });
          }
          break;

        case "rust":
          if (/println!/.test(line)) {
            diagnostics.push({
              from,
              to,
              severity: "info",
              message: "println! macro found",
            });
          }
          break;

        case "sql":
          if (/\b(select|from|where|join)\b/.test(line)) {
            diagnostics.push({
              from,
              to,
              severity: "info",
              message: "SQL keywords should be uppercase",
            });
          }
          break;

        case "html":
          if (/style\s*=/.test(line)) {
            diagnostics.push({
              from,
              to,
              severity: "warning",
              message: "Inline styles detected",
            });
          }
          break;

        case "css":
          if (/!important/.test(line)) {
            diagnostics.push({
              from,
              to,
              severity: "warning",
              message: "Avoid !important",
            });
          }
          break;

        case "json":
          if (/,\s*[\]}]/.test(line)) {
            diagnostics.push({
              from,
              to,
              severity: "error",
              message: "Trailing comma is invalid in JSON",
            });
          }
          break;
      }

      offset += line.length + 1;
    }

    /* ---------------- FILE LEVEL ---------------- */

    if (sawTabs && sawSpaces) {
      diagnostics.push({
        from: 0,
        to: Math.min(1, doc.length),
        severity: "warning",
        message: "Mixed indentation detected in file",
      });
    }

    return diagnostics;
  });
}

const javascriptLinter = linter(
  esLint(new Linter(), {
    parserOptions: { ecmaVersion: 2019, sourceType: "module" },
    env: {
      browser: true,
      es6: true,
      es2024: true,
    },
    rules: {
      semi: ["error", "always"],
      "no-undef": "off",
    },
  })
);

const languages = {
  python: { lang: python, lint: customLinter("python") },
  javascript: { lang: javascript, lint: javascriptLinter },
  cpp: { lang: cpp, lint: customLinter("cpp") },
  java: { lang: java, lint: customLinter("java") },
  rust: { lang: rust, lint: customLinter("rust") },
  css: { lang: css, lint: customLinter("css") },
  html: { lang: html, lint: customLinter("html") },
  sql: { lang: sql, lint: customLinter("sql") },
  json: { lang: json, lint: customLinter("json") },
  go: { lang: go, lint: customLinter("go") },
  markdown: { lang: markdown, lint: customLinter("markdown") },
  php: { lang: php, lint: customLinter("php") },
};

const CodeEditor = {
  EditorView: EditorView,
  basicSetup: basicSetup,
  dark: oneDark,
  commands: commands,
  snippetCompletion: snippetCompletion,
  languages: languages,
};
window.CodeEditor = CodeEditor;
