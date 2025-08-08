module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "prettier"],
  rules: {
    curly: "warn",
    "newline-before-return": "warn",
    "no-restricted-exports": "off",
    "react/jsx-sort-props": "warn",
    "react/no-array-index-key": "warn",
    "react/no-danger": "warn",
    "react/self-closing-comp": "warn",
    "react/function-component-definition": "warn",
    "react/no-unescaped-entities": "warn",
    "jsx-a11y/alt-text": "warn",
    "import/no-extraneous-dependencies": "warn",
    "import/no-anonymous-default-export": "warn",
    "react-hooks/exhaustive-deps": "warn",
  },
};
