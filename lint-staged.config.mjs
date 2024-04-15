export default {
  '*.{js,jsx,ts,tsx,vue}': () => {
    return [
      'npm run typecheck',
      'npm run lint:fix',
    ];
  },
};
