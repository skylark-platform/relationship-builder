import { jsonToGraphQLQuery } from "json-to-graphql-query";
import { SkylarkClient } from "./graphql/client";
import { GET_SKYLARK_OBJECT_TYPES } from "./graphql/queries";
import {
  GQLObjectRelationshipsType,
  GQLSkylarkObjectTypesResponse,
} from "./interfaces";

export const getAllSkylarkObjectTypes = async (client: SkylarkClient) => {
  const data = await client.request<GQLSkylarkObjectTypesResponse>(
    GET_SKYLARK_OBJECT_TYPES,
  );
  const objectTypesInSkylark = data.__type.possibleTypes.map(
    ({ name }) => name,
  );

  return objectTypesInSkylark;
};

export const getValidRelationshipsForObject = async (
  client: SkylarkClient,
  objectType: string,
): Promise<{ relationshipName: string; objectType: string }[]> => {
  const query = {
    query: {
      GET_OBJECT_RELATIONSHIPS: {
        __aliasFor: "__type",
        __args: {
          name: `${objectType}Relationships`,
        },
        inputFields: {
          name: true,
          type: {
            name: true,
          },
        },
      },
    },
  };

  const graphQLGetQuery = jsonToGraphQLQuery(query);

  const data = await client.request<GQLObjectRelationshipsType>(
    graphQLGetQuery,
  );

  const relationships =
    data.GET_OBJECT_RELATIONSHIPS?.inputFields.map(
      ({ name, type: { name: relationshipObjectType } }) => ({
        relationshipName: name,
        objectType: relationshipObjectType.replace("RelationshipInput", ""),
      }),
    ) || [];

  return relationships;
};
