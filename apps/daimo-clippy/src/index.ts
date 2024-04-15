import * as bodyParser from "body-parser";
import * as dotenv from "dotenv";
import express from "express";

dotenv.config();

// Import order matters here
// eslint-disable-next-line
import webhookRouter from "./webhook";

const app = express();
const port = process.env.PORT || 4100;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/webhooks", webhookRouter);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
