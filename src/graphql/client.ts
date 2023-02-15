import { GraphQLClient } from "graphql-request";
import { SKYLARK_API_KEY, SKYLARK_URI } from "../constants";

export const createSkylarkClient = () =>
  new GraphQLClient(SKYLARK_URI, {
    headers: {
      "x-api-key": SKYLARK_API_KEY,
    },
  });

export type SkylarkClient = ReturnType<typeof createSkylarkClient>;
