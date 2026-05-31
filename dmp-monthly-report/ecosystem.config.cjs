// PM2 config — production: uvicorn serves the built dist/ + API + data.json on :8000
// Usage (from this folder):
//   npm run build                       # rebuild after code changes
//   pm2 start ecosystem.config.cjs      # start / reload
//   pm2 restart dmp-report              # restart after a rebuild
//   pm2 logs dmp-report                 # tail logs
//   pm2 save                            # remember process list across reboots
const path = require("path");

module.exports = {
  apps: [
    {
      name: "dmp-report",
      cwd: __dirname,
      // run the venv's own uvicorn binary directly
      script: path.join(__dirname, "server", ".venv", "bin", "uvicorn"),
      args: "server.app:app --host 0.0.0.0 --port 8000",
      interpreter: "none", // it's a binary, don't run it through node
      autorestart: true,
      max_restarts: 10,
      env: {
        // override storage location here if needed, e.g.
        // DMP_STORAGE: "/some/other/path",
      },
    },
  ],
};
