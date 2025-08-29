import "dotenv/config";

import express from "express";
import serverAdapter from "../lib/bullDashbaord";

const app = express();

// The ExpressAdapter does not expose getBasePath(); mount using the same path set in lib/bullDashbaord.ts
app.use("/queues", serverAdapter.getRouter());

const port = process.env.BULL_BOARD_PORT || 3010;

app.listen(port, () => {
  console.log(`Bull Board is running on http://localhost:${port}/queues`);
});
