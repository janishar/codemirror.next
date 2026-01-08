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
import { go } from "@codemirror/lang-go";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { php } from "@codemirror/lang-php";

const extensions = [
  basicSetup,
  oneDark,
  linter(
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
  ),
];

const languages = {
  javascript: javascript,
  python: python,
	cpp: cpp,
	java: java,
	rust: rust,
	sql: sql,
	html: html,
	css: css,
	go: go,
	json: json,
	markdown: markdown,
	php: php,
};

const CodeEditor = {
  EditorView: EditorView,
  extensions: extensions,
  commands: commands,
  snippetCompletion: snippetCompletion,
  languages: languages,
};
window.CodeEditor = CodeEditor;
