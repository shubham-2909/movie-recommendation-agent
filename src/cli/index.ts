import { connectToDatabase } from "../config/db";
import { startCLI } from "./cli.controller";
import dotenv from "dotenv";
dotenv.config();

(async () => {
  await connectToDatabase();
  await startCLI();
})();
