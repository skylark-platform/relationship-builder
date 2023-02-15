# relationship-builder

## Set up

### Install dependencies

This project uses `yarn` so run:

```
yarn
```

### Connecting to your Skylark account

Create a `.env.local` file with the following:

```
SKYLARK_URI=
SKYLARK_API_KEY=
```

## Commands

### `yarn start <relationship_link_file.json>`

Links two objects together.

Given an input JSON file in the format below, links the objects together using their External IDs.
To use this utility, you'll want to convert your data into a JSON file which matches the format below.

```json
[
  {
    "from": {
      "type": "TvShow",
      "externalId": "tmdb-tv-shows/2316"
    },
    "to": {
      "type": "Episode",
      "externalId": "tmdb-tv-episodes/2413270"
    }
  },
  {
    "from": {
      "type": "TvShow",
      "externalId": "tmdb-tv-shows/2316"
    },
    "to": {
      "type": "Episode",
      "externalId": "tmdb-tv-episodes/170252"
    }
  }
]
```

### `yarn convertSingleTypedFileToLinksFile <json_file.json> <from objectType> <to objectType> <from key> to key>`

This is a helper script which will generate a links file (format above) that can be used by the `yarn start` command to create links in Skylark.

Use this if you have a JSON file containing relationships represented by External IDs.

Example: given the file `has-episodes.json` with the contents:

```json
[
  {
    "_id": "has-tv-episode/2316-2413270",
    "_from": "tmdb-tv-shows/2316",
    "_to": "tmdb-tv-episodes/2413270"
  },
  {
    "_id": "has-tv-episode/2316-170252",
    "_from": "tmdb-tv-shows/2316",
    "_to": "tmdb-tv-episodes/170252"
  }
]
```

when you run `yarn convertSingleTypedFileToLinksFile ./has-episodes.json TvShow Episode _from _to` it will generate the example links file from `yarn start`.

### `yarn addAvailabilityToAllObjects <Availability UID>`

Helper script which will add a given availability to every single object in Skylark.

Example:

```
yarn addAvailabilityToAllObjects 01GSADC2DA7BSFY2XXKVV9WQFH
```

### `yarn countAllObjects`

Helper script which will count every single object in Skylark.

Example:

```
yarn countAllObjects
```
