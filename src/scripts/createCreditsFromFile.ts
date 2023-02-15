import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { readJSON, writeJson } from "fs-extra";
import { jsonToGraphQLQuery } from "json-to-graphql-query";
import { createSkylarkClient, SkylarkClient } from "../graphql/client";
import { getObjectUid } from "../objects";
import { chunkArray, sleep } from "../utils";

const createCredit = async (
  client: SkylarkClient,
  personExtId: string,
  roleExtId: string,
  creditExtId: string,
  character: string,
  order: number,
) => {
  const creditExists = await getObjectUid(
    client,
    {
      type: "Credit",
      externalId: creditExtId,
    },
    true,
  );

  if (creditExists) {
    // Do nothing when Credit already exists
    return null;
  }

  try {
    const personUid = await getObjectUid(
      client,
      {
        type: "Person",
        externalId: personExtId,
      },
      true,
    );
    if (!personUid) {
      return null;
    }

    const roleUid = await getObjectUid(client, {
      type: "Role",
      externalId: roleExtId,
    });

    const mutation = {
      mutation: {
        createCredit: {
          __args: {
            credit: {
              external_id: creditExtId,
              character,
              order,
              relationships: {
                people: {
                  link: personUid,
                },
                roles: {
                  link: roleUid,
                },
              },
            },
          },
          uid: true,
          external_id: true,
        },
      },
    };

    const graphQLMutation = jsonToGraphQLQuery(mutation, { pretty: false });
    await client.request(graphQLMutation);
    return null;
  } catch (err) {
    console.error(err);
    return personExtId;
  }
};

// This script will create a Credit using the External IDs of a Person and Role
// It may need to be tweaked depending on the format of the JSON input file
const createCreditsFromFile = async () => {
  const [, , file] = process.argv;

  const json = await readJSON(file);

  if (!Array.isArray(json)) {
    throw new Error("File contents should be an array of objects");
  }

  // {
  //   "_key": "168999",
  //   "_id": "has-cast-crew-member/168999",
  //   "_from": "tmdb-tv-shows/19885",
  //   "_to": "tmdb-people/1237956",
  //   "_rev": "_dkx0hWy--K",
  //   "character": "Eurus Holmes",
  //   "order": 29,
  //   "known_for_department": "Acting"
  // },

  const credits: {
    _id: string;
    _from: string;
    _to: string;
    _rev: string;
    character: string;
    order: number;
    known_for_department: string;
  }[] = json;

  const client = createSkylarkClient();

  const chunkAmount = 50;
  const chunkedCredits = chunkArray(credits, chunkAmount);

  const missing: string[] = [];

  for (let index = 0; index < chunkedCredits.length; index++) {
    const chunk = chunkedCredits[index];
    const missingExtIds = await Promise.all(
      chunk.map(async (credit) => {
        const slug = credit.known_for_department
          .toLowerCase()
          .replaceAll("&", "and")
          .replaceAll(" ", "-");
        const roleExtId = `tmdb-known-for-department/${slug}`;

        const missingExtId = await createCredit(
          client,
          credit._to,
          roleExtId,
          credit._id,
          credit.character,
          credit.order,
        );

        return missingExtId;
      }),
    );
    missing.push(...(missingExtIds.filter((extid) => !!extid) as string[]));
    await sleep(1000);
    console.log(
      `Created Credits: ${chunk.length * (index + 1)}/${
        (chunkedCredits.length - 1) * chunkAmount +
        chunkedCredits[chunkedCredits.length - 1].length
      }`,
    );
  }
  await writeJson("./logs/missingPeople.json", missing);
};

createCreditsFromFile().catch(console.error);

// Given a list of missing external IDs, and the list of all people that should exists, outputs a file containing all the missing people
// (async () => {
//   const missing = await readJSON("./logs/missingPeople.json");
//   console.log("missing", missing.length);

//   const allPeople: { _id: string; also_known_as: string[] }[] = await readJSON(
//     "/Users/jameswallis/Downloads/demo-app-data-export 2/tmdb-people.json",
//   );
//   console.log("all", allPeople.length);

//   const toCreate = allPeople
//     .filter(({ _id }) => missing.includes(_id))
//     .map((person) => ({
//       ...person,
//       also_known_as: person.also_known_as.join(","),
//     }));
//   console.log("to create", toCreate.length);

//   await writeJson("./logs/missingPeopleToCreate.json", toCreate, { spaces: 2 });
// })();
