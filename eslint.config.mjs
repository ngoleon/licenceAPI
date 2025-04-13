import _import from "eslint-plugin-import";
import node from "eslint-plugin-node";
import promise from "eslint-plugin-promise";
import { fixupPluginRules } from "@eslint/compat";
import globals from "globals";

export default [{
    ignores: [
        "coverage/**/*.js",
        "**/gulpfile.babel.js",
        "**/dist/",
        "**/coverage/",
        "**/.nyc_oputput/",
        "**/node_modules/",
        "**/package.json"
    ]
}, {
    plugins: {
        import: fixupPluginRules(_import),
        node,
        promise
    },

    languageOptions: {
        globals: {
            ...globals.node,
            ...globals.mocha,
            document: false,
            navigator: false,
            window: false
        },

        ecmaVersion: 2018,
        sourceType: "module",

        parserOptions: {
            ecmaFeatures: {
                jsx: true
            }
        }
    },

    rules: {
        "accessor-pairs": "warn",

        "arrow-spacing": ["warn", {
            before: true,
            after: true
        }],

        "block-spacing": ["warn", "always"],

        "brace-style": ["warn", "1tbs", {
            allowSingleLine: true
        }],

        camelcase: ["warn", {
            properties: "never"
        }],

        "comma-dangle": ["error", {
            arrays: "never",
            objects: "never",
            imports: "never",
            exports: "never",
            functions: "never"
        }],

        "comma-spacing": ["warn", {
            before: false,
            after: true
        }],

        "comma-style": ["warn", "last"],
        "constructor-super": "warn",
        curly: ["warn", "multi-line"],
        "dot-location": ["warn", "property"],
        "eol-last": "warn",

        eqeqeq: ["warn", "always", {
            null: "ignore"
        }],

        "for-direction": "warn",
        "func-call-spacing": ["warn", "never"],
        "getter-return": "error",

        "generator-star-spacing": ["warn", {
            before: true,
            after: true
        }],

        "handle-callback-err": ["error", "^(err|error)$"],

        indent: ["warn", 4, {
            SwitchCase: 1,
            VariableDeclarator: 1,
            outerIIFEBody: 1,
            MemberExpression: 1,

            FunctionDeclaration: {
                parameters: 1,
                body: 1
            },

            FunctionExpression: {
                parameters: 1,
                body: 1
            },

            CallExpression: {
                arguments: 1
            },

            ArrayExpression: 1,
            ObjectExpression: 1,
            ImportDeclaration: 1,
            flatTernaryExpressions: false,
            ignoreComments: false
        }],

        "key-spacing": ["warn", {
            beforeColon: false,
            afterColon: true
        }],

        "keyword-spacing": ["warn", {
            before: true,
            after: true
        }],

        "new-cap": ["warn", {
            newIsCap: true,
            capIsNew: false
        }],

        "new-parens": "warn",
        "no-array-constructor": "warn",
        "no-caller": "warn",
        "no-case-declarations": "warn",
        "no-class-assign": "warn",
        "no-compare-neg-zero": "error",
        "no-cond-assign": "warn",
        "no-console": "off",
        "no-const-assign": "warn",

        "no-constant-condition": ["warn", {
            checkLoops: false
        }],

        "no-control-regex": "warn",
        "no-debugger": "error",
        "no-delete-var": "error",
        "no-dupe-args": "error",
        "no-dupe-class-members": "error",
        "no-dupe-keys": "error",
        "no-duplicate-case": "error",
        "no-empty": "warn",
        "no-empty-character-class": "error",
        "no-empty-pattern": "error",
        "no-eval": "error",
        "no-ex-assign": "error",
        "no-extend-native": "warn",
        "no-extra-bind": "warn",
        "no-extra-boolean-cast": "error",
        "no-extra-parens": ["error", "functions"],
        "no-extra-semi": "error",
        "no-fallthrough": "error",
        "no-floating-decimal": "warn",
        "no-func-assign": "error",
        "no-global-assign": "warn",
        "no-implied-eval": "error",
        "no-inner-declarations": ["warn", "functions"],
        "no-invalid-regexp": "error",
        "no-irregular-whitespace": "warn",
        "no-iterator": "warn",
        "no-label-var": "error",

        "no-labels": ["error", {
            allowLoop: false,
            allowSwitch: false
        }],

        "no-lone-blocks": "warn",

        "no-mixed-operators": ["warn", {
            groups: [
                ["==", "!=", "===", "!==", ">", ">=", "<", "<="],
                ["&&", "||"],
                ["in", "instanceof"]
            ],

            allowSamePrecedence: true
        }],

        "no-mixed-spaces-and-tabs": "warn",
        "no-multi-spaces": "warn",
        "no-multi-str": "warn",

        "no-multiple-empty-lines": ["warn", {
            max: 1,
            maxEOF: 0
        }],

        "no-negated-in-lhs": "error",
        "no-new": "warn",
        "no-new-func": "warn",
        "no-new-object": "warn",
        "no-new-require": "error",
        "no-new-symbol": "error",
        "no-new-wrappers": "warn",
        "no-obj-calls": "warn",
        "no-octal": "warn",
        "no-octal-escape": "warn",
        "no-path-concat": "warn",
        "no-proto": "warn",
        "no-redeclare": "warn",
        "no-regex-spaces": "error",
        "no-return-assign": ["error", "except-parens"],
        "no-return-await": "error",
        "no-await-in-loop": "warn",
        "no-self-assign": "error",
        "no-self-compare": "error",
        "no-sequences": "error",
        "no-shadow-restricted-names": "error",
        "no-sparse-arrays": "error",
        "no-tabs": "off",
        "no-template-curly-in-string": "warn",
        "no-this-before-super": "warn",
        "no-throw-literal": "error",
        "no-trailing-spaces": "warn",
        "no-undef": "error",
        "no-undef-init": "error",
        "no-unexpected-multiline": "error",
        "no-unmodified-loop-condition": "error",

        "no-unneeded-ternary": ["warn", {
            defaultAssignment: false
        }],

        "no-unreachable": "error",
        "no-unsafe-finally": "warn",
        "no-unsafe-negation": "error",

        "no-unused-expressions": ["error", {
            allowShortCircuit: true,
            allowTernary: true,
            allowTaggedTemplates: true
        }],

        "no-unused-labels": "error",

        "no-unused-vars": ["error", {
            vars: "all",
            args: "none",
            ignoreRestSiblings: true
        }],

        "no-use-before-define": ["error", {
            functions: false,
            classes: false,
            variables: false
        }],

        "no-useless-call": "error",
        "no-useless-computed-key": "error",
        "no-useless-constructor": "warn",
        "no-useless-escape": "error",
        "no-useless-rename": "error",
        "no-useless-return": "error",
        "no-whitespace-before-property": "error",
        "no-with": "error",
        "object-curly-spacing": ["warn", "always"],

        "object-property-newline": ["warn", {
            allowMultiplePropertiesPerLine: true
        }],

        "one-var": ["error", {
            initialized: "never"
        }],

        "operator-linebreak": ["warn", "after", {
            overrides: {
                "?": "before",
                ":": "before"
            }
        }],

        "padded-blocks": ["warn", {
            blocks: "never",
            switches: "never",
            classes: "never"
        }],

        "prefer-promise-reject-errors": ["warn", {
            allowEmptyReject: true
        }],

        quotes: ["warn", "double", {
            avoidEscape: true,
            allowTemplateLiterals: true
        }],

        "rest-spread-spacing": ["warn", "never"],
        semi: ["error", "always"],

        "semi-spacing": ["warn", {
            before: false,
            after: true
        }],

        "space-before-blocks": ["warn", "always"],
        "space-before-function-paren": ["error", "never"],
        "space-in-parens": ["warn", "never"],
        "space-infix-ops": "warn",

        "space-unary-ops": ["warn", {
            words: true,
            nonwords: false
        }],

        "spaced-comment": ["off", {
            line: {
                markers: ["*package", "!", "/", ",", "="]
            },

            block: {
                balanced: true,
                markers: ["*package", "!", ",", ":", "::", "flow-include"],
                exceptions: ["*"]
            }
        }],

        "symbol-description": "warn",
        "template-curly-spacing": ["warn", "never"],
        "template-tag-spacing": ["warn", "never"],
        "unicode-bom": ["warn", "never"],
        "use-isnan": "error",

        "valid-typeof": ["warn", {
            requireStringLiterals: true
        }],

        "wrap-iife": ["error", "any", {
            functionPrototypeMethods: true
        }],

        "yield-star-spacing": ["warn", "both"],
        yoda: ["error", "never"],
        "import/export": "error",
        "import/first": "warn",
        "import/no-duplicates": "error",
        "import/no-named-default": "error",
        "import/no-webpack-loader-syntax": "error",
        "node/process-exit-as-throw": "error",
        "promise/param-names": "error",
        "array-callback-return": ["error", {
            allowImplicit: true
        }],
        "block-scoped-var": "error",
        "no-alert": "error",
        "no-empty-function": "error",
        "no-eq-null": "warn",
        "no-extra-label": "error",

        "no-magic-numbers": ["warn", {
            ignore: [200, 400, 404, 500]
        }],

        "no-useless-concat": "warn",
        "vars-on-top": "warn"
    }
}];
