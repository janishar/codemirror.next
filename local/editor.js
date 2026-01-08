import { EditorView, basicSetup } from "codemirror";
import { javascript, esLint, snippets } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import Linter from "eslint4b-prebuilt";
import { linter } from "@codemirror/lint";
import { snippetCompletion } from "@codemirror/autocomplete";
import * as commands from "@codemirror/commands";

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

const CodeEditor = {
  EditorView: EditorView,
  extensions: extensions,
  snippets: snippets,
  commands: commands,
  snippetCompletion: snippetCompletion,
  javascript: javascript,
};
window.CodeEditor = CodeEditor;
