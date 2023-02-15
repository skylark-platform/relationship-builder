import { writeJSON } from "fs-extra";
import { jsonToGraphQLQuery } from "json-to-graphql-query";
import { SkylarkClient } from "./graphql/client";
import { Link, ObjectInfo, GQLListObjectResponse } from "./interfaces";
import { chunkArray, sleep } from "./utils";

const commonArgs = {
  ignore_availability: true,
};

export const getObjectUid = async (
  client: SkylarkClient,
  { type, externalId }: ObjectInfo,
  ignoreNotFound?: boolean,
) => {
  const operation = `get${type}`;

  const query = {
    query: {
      getObjectUid: {
        __aliasFor: operation,
        __args: {
          ...commonArgs,
          external_id: externalId,
        },
        uid: true,
      },
    },
  };

  const graphQLMutation = jsonToGraphQLQuery(query, { pretty: false });

  try {
    const data = await client.request<{ getObjectUid: { uid: string } }>(
      graphQLMutation,
    );
    return data.getObjectUid.uid;
  } catch (err) {
    if (ignoreNotFound) {
      return null;
    }
    throw err;
  }
};

// https://docs.skylarkplatform.com/docs/link-existing-objects
const linkObject = async (client: SkylarkClient, { from, to }: Link) => {
  const operation = `update${from.type}`;

  // TODO need to improve this because we can't guarantee the relationship name will match the object

  const argName = from.type
    .replaceAll(/(?<!^)[A-Z]/g, (match) => `_${match}`)
    .toLowerCase(); // Episode -> episode / ParentalGuidance -> parental_guidance
  const relationshipName = `${to.type
    .replaceAll(/(?<!^)[A-Z]/g, (match) => `_${match}`)
    .toLowerCase()}s`; // Brand -> brands / ParentalGuidance -> parental_guidances

  const fromObjectExists = await getObjectUid(client, from, true);
  const toObjectUid = await getObjectUid(client, to, true);

  // Ignore any not found
  if (!toObjectUid || !fromObjectExists) {
    return {
      missingToExtId: toObjectUid ? "" : to.externalId,
      missingFromExtId: fromObjectExists ? "" : from.externalId,
    };
  }

  const mutation = {
    mutation: {
      createLink: {
        __aliasFor: operation,
        __args: {
          external_id: from.externalId,
          [argName]: {
            relationships: {
              [relationshipName]: {
                link: toObjectUid,
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

  try {
    await client.request(graphQLMutation);
  } catch (err) {
    console.log(err);
  }

  return {
    missingToExtId: "",
    missingFromExtId: "",
  };
};

export const linkObjects = async (client: SkylarkClient, links: Link[]) => {
  const chunkAmount = 50;
  const chunkedLinkObjects = chunkArray(links, chunkAmount);

  const missingFromObjects = [];
  const missingToObjects = [];

  for (let index = 0; index < chunkedLinkObjects.length; index++) {
    const chunk = chunkedLinkObjects[index];
    const arr = await Promise.all(
      chunk.map((link) => linkObject(client, link)),
    );

    missingFromObjects.push(
      ...arr
        .map(({ missingFromExtId }) => missingFromExtId)
        .filter((extId) => extId),
    );
    missingToObjects.push(
      ...arr
        .map(({ missingToExtId }) => missingToExtId)
        .filter((extId) => extId),
    );

    await sleep(1000);

    console.log(
      `Linked: ${
        index === chunkedLinkObjects.length - 1
          ? links.length
          : chunk.length * (index + 1)
      }/${links.length}`,
    );
  }

  writeJSON("./logs/missingFromObjects.json", [...new Set(missingFromObjects)]);
  writeJSON("./logs/missingToObjects.json", [...new Set(missingToObjects)]);
};

export const fetchAllObjectsOfType = async (
  client: SkylarkClient,
  objectType: string,
) => {
  const objects = [];
  let nextToken: string | null | undefined;

  while (nextToken !== "" && nextToken !== null) {
    const query = {
      query: {
        listAll: {
          __aliasFor: `list${objectType}`,
          __args: {
            next_token: nextToken || "",
            ignore_availability: true,
            limit: 50,
          },
          next_token: true,
          objects: {
            __typename: true,
            uid: true,
            external_id: true,
          },
        },
      },
    };

    const graphQLQuery = jsonToGraphQLQuery(query, { pretty: false });
    const data = await client.request<GQLListObjectResponse>(graphQLQuery);

    objects.push(...data.listAll.objects);
    nextToken = data.listAll.next_token;
  }

  return { objectType, objects };
};
