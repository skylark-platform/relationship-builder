import { SkylarkClient } from "./graphql/client";
import { GET_SKYLARK_OBJECT_TYPES } from "./graphql/queries";
import { GQLSkylarkObjectTypesResponse, Link } from "./interfaces";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateInputFile = (contents: any): Link[] => {
  if (!Array.isArray(contents)) {
    throw new Error("Input file contents is not an array");
  }

  const validObjects = contents.every((val) => {
    return val && val.from && val.to;
  });

  if (!validObjects) {
    throw new Error("Input file contents do not match the Link[] interface");
  }

  return contents;
};

export const validateObjectTypesExist = async (
  client: SkylarkClient,
  objectTypes: string[],
) => {
  const data = await client.request<GQLSkylarkObjectTypesResponse>(
    GET_SKYLARK_OBJECT_TYPES,
  );
  const objectTypesInSkylark = data.__type.possibleTypes.map(
    ({ name }) => name,
  );

  const uniqueObjectTypes = new Set(objectTypes);

  uniqueObjectTypes.forEach((type) => {
    if (!objectTypesInSkylark.includes(type)) {
      throw new Error(`${type} is not a valid Skylark Object Type`);
    }
  });
};

export const validateLinkObjectTypes = async (
  client: SkylarkClient,
  links: Link[],
) => {
  const objectTypes = links.reduce((prev, { from, to }) => {
    return [...prev, from.type, to.type];
  }, [] as string[]);

  await validateObjectTypesExist(client, objectTypes);
};
