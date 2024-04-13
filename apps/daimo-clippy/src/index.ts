import express from "express";
import * as bodyParser from "body-parser";
import * as dotenv from "dotenv";
import webhookRouter from "./webhook";

dotenv.config();

const app = express();
const port = process.env.PORT || 4100;

app.use(express.json());
app.use(bodyParser.urlencoded());

app.use("/webhook", webhookRouter);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
