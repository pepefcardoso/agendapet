module.exports = {
  "**/*.{ts,tsx,js}": ["pnpm eslint --fix", "pnpm prettier --write", "git add"],
};
