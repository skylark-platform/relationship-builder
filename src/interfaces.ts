export interface ObjectInfo {
  type: string;
  externalId: string;
}

export interface Link {
  from: ObjectInfo;
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
