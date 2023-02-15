import { ensureDir, readJSON, writeJSON } from "fs-extra";
import { basename, join } from "path";
import { Link } from "../interfaces";

// Utility script to take a JSON file that doesn't match the link input, and convert it

/**
 * Example
 *
 * For the unformatted file:
 * [
    {
        "_key": "tv-2316-35",
        "_id": "has-genre/tv-2316-35",
        "_from": "tmdb-tv-shows/2316",
        "_to": "tv-genre/35",
        "_rev": "_dkx1-rC---"
    },
    {
        "_key": "tv-96677-9648",
        "_id": "has-genre/tv-96677-9648",
        "_from": "tmdb-tv-shows/96677",
        "_to": "tv-genre/9648",
        "_rev": "_dkx1-rC--_"
    },
  ]
 *
 * We can convert it into the Link[] format using
 * yarn convertSingleTypedFileToLinksFile "~/demo-app-data-export 2/has-genre.json" TvShow Genre _from _to
 *
 * to output:
 * [
    {
      "from": {
        "type": "TvShow",
        "externalId": "tmdb-tv-shows/2316"
      },
      "to": {
        "type": "Genre",
        "externalId": "tv-genre/35"
      }
    },
    {
      "from": {
        "type": "TvShow",
        "externalId": "tmdb-tv-shows/96677"
      },
      "to": {
        "type": "Genre",
        "externalId": "tv-genre/9648"
      }
    },
  ]
 *
 * And then run the relationship builder on the generated file in conversions/links
 */
const convertSingleTypedFileToLinkFile = async () => {
  const [, , file, fromType, toType, fromKey, toKey] = process.argv;

  const json = await readJSON(file);

  if (!Array.isArray(json)) {
    throw new Error("File contents should be an array of objects");
  }

  const links = json.map((obj): Link => {
    return {
      from: {
        type: fromType,
        externalId: obj[fromKey],
      },
      to: {
        type: toType,
        externalId: obj[toKey],
      },
    };
  });

  const conversionsDir = join(__dirname, "../../conversions/links");
  await ensureDir(conversionsDir);
  await writeJSON(join(conversionsDir, basename(file)), links, { spaces: 2 });
};

convertSingleTypedFileToLinkFile().catch(console.error);
