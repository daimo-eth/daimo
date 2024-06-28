import * as bodyParser from "body-parser";
import * as dotenv from "dotenv";
import express, { Request, Response } from "express";

dotenv.config();

const app = express();
const port = 3008;

app.use(bodyParser.json());
app.get("/health", (req: Request, res: Response) => res.send("Up!"));

// TODO
app.post("/swap", async (req: Request, res: Response) => {});

app.listen(port, () => console.log(`Server is listening on port ${port}`));
module.exports = app;
