import * as dotenv from "dotenv";
import { jsonToGraphQLQuery } from "json-to-graphql-query";
dotenv.config({ path: ".env.local" });
import { createSkylarkClient, SkylarkClient } from "../graphql/client";
import { GET_AVAILABILITY, GET_SKYLARK_OBJECT_TYPES } from "../graphql/queries";
import { GQLSkylarkObjectTypesResponse } from "../interfaces";
import { fetchAllObjectsOfType } from "../objects";
import { chunkArray, sleep } from "../utils";

const linkAvailabilityToObject = async (
  client: SkylarkClient,
  objectType: string,
  objectUid: string,
  availabilityUid: string,
) => {
  const operation = `update${objectType}`;

  const argName = objectType
    .replaceAll(/(?<!^)[A-Z]/g, (match) => `_${match}`)
    .toLowerCase(); // Episode -> episode / ParentalGuidance -> parental_guidance

  const mutation = {
    mutation: {
      linkAvailability: {
        __aliasFor: operation,
        __args: {
          uid: objectUid,
          [argName]: {
            availability: {
              link: availabilityUid,
            },
          },
        },
        uid: true,
      },
    },
  };

  const graphQLMutation = jsonToGraphQLQuery(mutation, { pretty: false });

  try {
    await client.request(graphQLMutation);
  } catch (err) {
    console.log("Error adding Availability to", objectType, objectUid);
    throw err;
  }
};

export const addAvailabilityToAllObjects = async () => {
  const client = createSkylarkClient();

  const [, , availabilityUid] = process.argv;

  try {
    await client.request(GET_AVAILABILITY, {
      uid: availabilityUid,
    });
    console.log(`Availability "${availabilityUid}" exists`);
  } catch (err) {
    console.log(`Availability "${availabilityUid}" may not exist:`);
    throw err;
  }

  const data = await client.request<GQLSkylarkObjectTypesResponse>(
    GET_SKYLARK_OBJECT_TYPES,
  );
  const objectTypes = data.__type.possibleTypes.map(({ name }) => name);

  console.log(`Fetching all objects (${objectTypes.join(", ")})...`);

  // Fetch all objects
  const allObjects = (
    await Promise.all(
      objectTypes.map(async (objectType) => {
        return fetchAllObjectsOfType(client, objectType);
      }),
    )
  ).flatMap(({ objects }) => objects);

  console.log(
    `Assigning Availability "${availabilityUid}" to ${allObjects.length} objects`,
  );

  const chunkAmount = 75;
  const chunkedAllObjects = chunkArray(allObjects, chunkAmount);

  for (let index = 0; index < chunkedAllObjects.length; index++) {
    const chunk = chunkedAllObjects[index];
    await Promise.all(
      chunk.map(({ __typename, uid }) =>
        linkAvailabilityToObject(client, __typename, uid, availabilityUid),
      ),
    );

    await sleep(1000);

    console.log(
      `Linked: ${
        index === chunkedAllObjects.length - 1
          ? allObjects.length
          : chunk.length * (index + 1)
      }/${allObjects.length}`,
    );
  }
};

addAvailabilityToAllObjects().catch(console.error);
