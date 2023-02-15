import { ensureDir, readJSON, writeJSON } from "fs-extra";
import { basename, join } from "path";
import { Link } from "../interfaces";

// Utility script that takes two JSON files, one containing object data that has an image path, the other which contains all images and their external IDs
// Likely needs to be tweaked depending on the file format

const convertObjectAndImagePathsToLinksFile = async () => {
  const [, , file, fromType, fromKey, imageFile] = process.argv;

  const json = await readJSON(file);
  const images = await readJSON(imageFile);

  if (!Array.isArray(json)) {
    throw new Error("File contents should be an array of objects");
  }

  if (!Array.isArray(images)) {
    throw new Error("Image file contents should be an array of objects");
  }

  // Use this when you want to use a single property (e.g. obj.property = "external-id")
  const links = json
    .map((obj): Link | null => {
      const image = images.find(({ path }) => `/${path}` === obj.profile_path);
      const imageExtId = image ? image._id : "";
      if (!imageExtId) {
        return null;
      }
      return {
        from: {
          type: fromType,
          externalId: obj[fromKey],
        },
        to: {
          type: "Image",
          externalId: imageExtId,
        },
      };
    })
    .filter((link) => link !== null);

  // Use this when you have a property that is an array (e.g. obj.property = ["external-id-1", "external-id-2"])
  // const key = "furtherBackdrops";
  // const linksArr = json.map((obj) => {
  //   return obj[key].map((imgPath: string) => {
  //     const image = images.find(({ path }) => `/${path}` === imgPath);
  //     const imageExtId = image ? image._id : "";
  //     if (!imageExtId) {
  //       return null;
  //     }
  //     return {
  //       from: {
  //         type: fromType,
  //         externalId: obj[fromKey],
  //       },
  //       to: {
  //         type: "Image",
  //         externalId: imageExtId,
  //       },
  //     };
  //   });
  // });
  // const links = linksArr.flatMap((arr) => arr);

  const conversionsDir = join(__dirname, "../../conversions/links");
  await ensureDir(conversionsDir);
  await writeJSON(join(conversionsDir, `images-for-${basename(file)}`), links, {
    spaces: 2,
  });
};

convertObjectAndImagePathsToLinksFile().catch(console.error);
