#!/usr/bin/env node

import { main } from "../src/cli";

main().catch((err: unknown) => {
  console.error(err);

  process.exit(1);
});
