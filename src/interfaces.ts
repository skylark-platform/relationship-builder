export interface ObjectInfo {
  type: string;
  externalId: string;
}

export interface Link {
  from: ObjectInfo & { relationshipName?: string };
  to: ObjectInfo;
}

export interface GQLSkylarkObjectTypesResponse {
  __type: {
    name: "Metadata";
    possibleTypes: {
      name: string;
    }[];
  };
}

export interface GQLListObjectResponse {
  listAll: {
    next_token: string;
    objects: {
      __typename: string;
      uid: string;
      external_id: string;
    }[];
  };
}

export interface GQLObjectRelationshipsType {
  GET_OBJECT_RELATIONSHIPS: {
    name: string;
    inputFields: {
      name: string;
      type: {
        name: string;
      };
    }[];
  } | null;
}

export type ObjectTypesWithRelationships = Record<
  string,
  { relationshipName: string; objectType: string }[]
>;
