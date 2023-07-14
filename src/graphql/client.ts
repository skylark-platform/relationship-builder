import { GraphQLClient } from "graphql-request";
import { SKYLARK_API_KEY, SKYLARK_URI } from "../constants";

export const createSkylarkClient = () =>
  new GraphQLClient(SKYLARK_URI, {
    headers: {
      Authorization: SKYLARK_API_KEY,
      "x-bypass-cache": "1",
    },
  });

export type SkylarkClient = ReturnType<typeof createSkylarkClient>;
