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

const getUserInput = async (): Promise<void> => {
  rl.question(
    chalk.blueBright("What kind of movie are you looking for today? "),
    async (answer) => {
      if (!answer.trim()) {
        console.log(chalk.red("Oops! You didn’t enter anything. Try again."));
        return getUserInput();
      }

      let previousQueries: string[] = [answer];
      let attempts = 0;
      let suggestedMovies: string[] = [];
      let feedback = "";
      let probingContext: { q: string; a: string }[] = [];

      while (attempts < 3) {
        const fullQuery = previousQueries.join(" ");
        const movies = await getMovieRecommendations(fullQuery);

        if (movies.length > 0) {
          console.log(chalk.green("\nHere are your recommendations:"));
          suggestedMovies = movies.map((movie: any) => movie.title);

          movies.forEach((movie: any, index: number) => {
            console.log(
              `${index + 1}. ${movie.title} (${movie.year}) - ${movie.genre}`
            );
          });

          feedback = await getYesNoResponse();

          if (feedback === "y") {
            console.log(
              chalk.green(
                "\n Thanks for using our movie recommendation system. Enjoy your movie! 🎬"
              )
            );
            runInBackgroundTask(() =>
              saveUserLog(answer, suggestedMovies, probingContext, true)
            );
            rl.close();
            return;
          }
        } else {
          console.log(chalk.red("\nNo matches found."));
          feedback = "n";
        }

        if (feedback === "n") {
          console.log(
            chalk.yellow("\nLet's refine your search with better questions:")
          );

          previousQueries = [answer];

          // First follow-up question
          let followUpQuestion = await generateFirstFollowUpQuestion(answer);
          console.log(chalk.magentaBright(`• ${followUpQuestion}`));

          let userResponse = await new Promise<string>((resolve) => {
            rl.question(chalk.cyanBright("> "), resolve);
          });

          probingContext.push({ q: followUpQuestion, a: userResponse });
          let refinedQuery = await generateRefinedQuery(
            previousQueries,
            followUpQuestion,
            userResponse
          );
          previousQueries.push(refinedQuery);

          // Second follow-up question
          followUpQuestion = await generateNextFollowUpQuestion(
            followUpQuestion,
            userResponse
          );
          console.log(chalk.magentaBright(`• ${followUpQuestion}`));

          userResponse = await new Promise<string>((resolve) => {
            rl.question(chalk.cyanBright("> "), resolve);
          });

          probingContext.push({ q: followUpQuestion, a: userResponse });
          refinedQuery = await generateRefinedQuery(
            previousQueries,
            followUpQuestion,
            userResponse
          );
          previousQueries.push(refinedQuery);

          // Third follow-up question (New addition)
          followUpQuestion = await generateNextFollowUpQuestion(
            followUpQuestion,
            userResponse
          );
          console.log(chalk.magentaBright(`• ${followUpQuestion}`));

          userResponse = await new Promise<string>((resolve) => {
            rl.question(chalk.cyanBright("> "), resolve);
          });

          probingContext.push({ q: followUpQuestion, a: userResponse });
          refinedQuery = await generateRefinedQuery(
            previousQueries,
            followUpQuestion,
            userResponse
          );
          previousQueries.push(refinedQuery);
        }

        attempts++;
      }

      console.log(
        chalk.red(
          "\nSorry, we couldn't find the perfect movie. We have saved your preferences and we will notify you when we get movies related to your preferences."
        )
      );
      runInBackgroundTask(() =>
        saveUserLog(answer, suggestedMovies, probingContext, false)
      );

      rl.close();
    }
  );
};

export const startCLI = async (): Promise<void> => {
  console.clear();
  console.log(
    pastel(figlet.textSync("Movie Agent", { horizontalLayout: "full" }))
  );
  console.log(chalk.cyanBright("Welcome to the Movie Recommendation Agent!"));
  await getUserInput();
};
