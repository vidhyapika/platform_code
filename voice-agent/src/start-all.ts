import { spawn } from "child_process";

import { fileURLToPath } from "url";

import { dirname, join } from "path";



const __dirname = dirname(fileURLToPath(import.meta.url));

const root = join(__dirname, "..");



const agent = spawn("node", [join(root, "dist/index.js"), "start"], {

  stdio: "inherit",

  env: process.env,

});



function shutdown() {

  agent.kill();

  process.exit(0);

}



process.on("SIGINT", shutdown);

process.on("SIGTERM", shutdown);



agent.on("exit", (code) => {

  console.error("[start-all] agent exited", code);

  shutdown();

});

