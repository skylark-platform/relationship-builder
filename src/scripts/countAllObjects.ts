import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createSkylarkClient } from "../graphql/client";
import { GET_SKYLARK_OBJECT_TYPES } from "../graphql/queries";
import { GQLSkylarkObjectTypesResponse } from "../interfaces";
import { fetchAllObjectsOfType } from "../objects";

export const countAllObjects = async () => {
  const client = createSkylarkClient();

  const data = await client.request<GQLSkylarkObjectTypesResponse>(
    GET_SKYLARK_OBJECT_TYPES,
  );
  const objectTypes = data.__type.possibleTypes.map(({ name }) => name);

  console.log(`Fetching all objects (${objectTypes.join(", ")})...`);

  // Fetch all objects
  const allObjects = await Promise.all(
    objectTypes.map(async (objectType) =>
      fetchAllObjectsOfType(client, objectType),
    ),
  );

  let totalNumObjects = 0;
  allObjects.forEach(({ objectType, objects }) => {
    console.log(objectType, objects.length);
    totalNumObjects += objects.length;
  });

  console.log("Total objects in Skylark:", totalNumObjects);
};

countAllObjects().catch(console.error);
