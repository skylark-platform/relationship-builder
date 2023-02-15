import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createSkylarkClient } from "./graphql/client";
import { linkObjects } from "./objects";
import { validateInputFile, validateLinkObjectTypes } from "./validators";
import fs, { readJSON } from "fs-extra";

// Creates links between objects

// Also need to create Credits

// Separate tool for taking Seasons out of the Brands, then create file to link episodes to seasons

// const links: Link[] = [
//   {
//     from: {
//       type: "TvShow",
//       externalId: "tmdb-tv-shows/2316",
//     },
//     to: {
//       type: "Genre",
//       externalId: "tv-genre/35",
//     },
//   },
//   {
//     from: {
//       type: "TvShow",
//       externalId: "tmdb-tv-shows/96677",
//     },
//     to: {
//       type: "Genre",
//       externalId: "tv-genre/9648",
//     },
//   },
// ];

const main = async () => {
  const inputFilePath = process.argv[2];
  console.log(`Input file: ${inputFilePath}`);

  if (!inputFilePath) {
    throw new Error("Input file not given");
  }

  const inputFileExists = await fs.pathExists(inputFilePath);
  if (!inputFileExists) {
    throw new Error(`Input file not found: ${inputFilePath}`);
  }

  const fileContent = await readJSON(inputFilePath);

  const links = validateInputFile(fileContent);

  const client = createSkylarkClient();

  validateLinkObjectTypes(client, links);

  linkObjects(client, links);

  /**
   * STEPS
   * 1. Validate input file is correctly formatted
   * 2. Validate all input file objects exist in Skylark
   * 3. Validate all objects exist? (MAYBE)
   * 4. Attempt to link objects
   *    - Handle when link already exists, don't error
   *    - Error if one of the objects doesn't exist
   *    - Should be able to be run more than once without issues
   */
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
