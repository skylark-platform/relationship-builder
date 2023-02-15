import { gql } from "graphql-request";

// The "ObjectTypes" enum is updated when an object is added or removed from Skylark
export const GET_SKYLARK_OBJECT_TYPES = gql`
  query GET_SKYLARK_OBJECT_TYPES {
    __type(name: "Metadata") {
      possibleTypes {
        name
      }
    }
  }
`;

export const GET_AVAILABILITY = gql`
  query GET_AVAILABILITY($uid: String!) {
    getAvailability(uid: $uid) {
      uid
    }
  }
`;
