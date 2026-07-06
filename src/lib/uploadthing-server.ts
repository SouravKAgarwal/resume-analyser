import "server-only";

import { UTApi } from "uploadthing/server";

/** Server-side UploadThing client — used to mint signed download URLs. */
export const utapi = new UTApi();
