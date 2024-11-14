import { describe, expect, it } from "vitest";
import { z } from "zod";
import { zodToTs } from "../src";
import { printNodeTest } from "./utils";

const ItemsSchema = z.object({
  name: z.string().optional().default("default"),
});

describe("z.default()", () => {
  const { node } = zodToTs(ItemsSchema, "User");

  it.only("outputs name as a non optional string", () => {
    expect(printNodeTest(node)).toMatchInlineSnapshot(`
      "{
          name: string;
      }"
    `);
  });
});
