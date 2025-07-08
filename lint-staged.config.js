module.exports = {
  "**/*.(ts|tsx|js)": (filenames) => [
    `pnpm eslint --fix ${filenames.join(" ")}`,
    `pnpm prettier --write ${filenames.join(" ")}`,
  ],
};
