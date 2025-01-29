import readline from "readline";
import chalk from "chalk";
import figlet from "figlet";
import { pastel } from "gradient-string";
import {
  generateFirstFollowUpQuestion,
  generateNextFollowUpQuestion,
  getMovieRecommendations,
  generateRefinedQuery,
} from "./helpers";
import { saveUserLog } from "../models/LogEntry";
import { runInBackgroundTask } from "../utils/run-in-background";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Prompts the user for a valid yes/no response.
 * @returns {Promise<string>} "y" or "n"
 */
const getYesNoResponse = async (): Promise<string> => {
  while (true) {
    const response = await new Promise<string>((resolve) => {
      rl.question(chalk.blueBright("\nAre you satisfied? (y/n): "), resolve);
    });

    const cleanResponse = response.trim().toLowerCase();

    if (["y", "n"].includes(cleanResponse)) {
      return cleanResponse;
    }

    console.log(chalk.red("❌ Invalid input! Please enter 'y' or 'n'."));
  }
};

/**
 * Handles user input for the movie recommendation CLI.
 */
const getUserInput = async (): Promise<void> => {
  rl.question(
    chalk.blueBright("What kind of movie are you looking for today? "),
    async (answer) => {
      if (!answer.trim()) {
        console.log(chalk.red("Oops! You didn’t enter anything. Try again."));
        rl.close();
        return;
      }

      let previousQueries: string[] = [answer]; // Store only the user's original query
      let attempts = 0;
      let suggestedMovies: string[] = [];
      let feedback = ""; // ✅ Store feedback ("y" or "n")
      let probingContext: string[] = []; // ✅ Stores refined queries from probing

      while (attempts < 3) {
        const fullQuery = previousQueries.join(" "); // Use only the original user input
        const movies = await getMovieRecommendations(fullQuery);

        if (movies.length > 0) {
          console.log(chalk.green("\nHere are your recommendations:"));
          suggestedMovies = movies.map((movie: any) => movie.title);

          movies.forEach((movie: any, index: number) => {
            console.log(
              `${index + 1}. ${movie.title} (${movie.year}) - ${movie.genre}`
            );
          });

          feedback = await getYesNoResponse(); // ✅ Ensures only "y" or "n" input

          // ✅ Run logging in the background (non-blocking)
          runInBackgroundTask(() =>
            saveUserLog(
              answer,
              suggestedMovies,
              probingContext,
              feedback === "y"
            )
          );

          if (feedback === "y") {
            console.log(chalk.green("\nEnjoy your movie! 🎬"));
            rl.close();
            return;
          }
        } else {
          console.log(chalk.red("\nNo matches found."));
          feedback = "n"; // ✅ Mark as unsuccessful attempt
        }

        console.log(
          chalk.yellow("\nLet's refine your search with better questions:")
        );

        // ✅ Remove all previous probing responses and keep only original input
        previousQueries = [answer];

        // **Ask first follow-up question based on initial user input**
        let followUpQuestion = await generateFirstFollowUpQuestion(answer);
        console.log(chalk.magentaBright(`• ${followUpQuestion}`));

        let userResponse = await new Promise<string>((resolve) => {
          rl.question(chalk.cyanBright("> "), resolve);
        });

        let refinedQuery = await generateRefinedQuery(
          previousQueries,
          followUpQuestion,
          userResponse
        );
        previousQueries.push(refinedQuery);
        probingContext.push(refinedQuery); // ✅ Store probing query

        // **Ask second follow-up question based on first response**
        followUpQuestion = await generateNextFollowUpQuestion(
          followUpQuestion,
          userResponse
        );
        console.log(chalk.magentaBright(`• ${followUpQuestion}`));

        userResponse = await new Promise<string>((resolve) => {
          rl.question(chalk.cyanBright("> "), resolve);
        });

        refinedQuery = await generateRefinedQuery(
          previousQueries,
          followUpQuestion,
          userResponse
        );
        previousQueries.push(refinedQuery);
        probingContext.push(refinedQuery); // ✅ Store probing query

        attempts++;
      }

      console.log(
        chalk.red(
          "\nSorry, we couldn't find the perfect movie. Try again later."
        )
      );
      runInBackgroundTask(() =>
        saveUserLog(answer, suggestedMovies, probingContext, feedback === "y")
      );

      rl.close();
    }
  );
};

/**
 * Starts the Movie Recommendation CLI.
 */
export const startCLI = async (): Promise<void> => {
  console.clear();
  console.log(
    pastel(figlet.textSync("Movie Agent", { horizontalLayout: "full" }))
  );
  console.log(chalk.cyanBright("Welcome to the Movie Recommendation Agent!"));
  await getUserInput();
};
