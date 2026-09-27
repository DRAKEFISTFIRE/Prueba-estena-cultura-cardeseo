import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { fileURLToPath } from "url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL ?? "http://localhost:3001",
  secret: process.env.PAYLOAD_SECRET ?? (() => {
    throw new Error("PAYLOAD_SECRET no definida");
  })(),
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL }
  }),
  editor: lexicalEditor({}),
  admin: {
    user: "admin-users"
  },
  collections: [
    {
      slug: "admin-users",
      auth: true,
      access: {
        create: ({ req }) => req.user?.role === "internal_admin",
        delete: ({ req }) => req.user?.role === "internal_admin",
        read: () => true,
        update: ({ req }) => req.user?.role === "internal_admin"
      },
      fields: [
        {
          name: "role",
          type: "select",
          required: true,
          options: [
            { label: "Teatre", value: "theatre" },
            { label: "ICUB (lectura)", value: "icub" },
            { label: "Administració interna", value: "internal_admin" }
          ]
        },
        {
          name: "venue",
          type: "relationship",
          relationTo: "venues",
          admin: {
            condition: (_data, siblingData) => siblingData?.role === "theatre"
          }
        }
      ]
    },
    {
      slug: "venues",
      access: {
        read: ({ req }) => {
          if (req.user?.role === "internal_admin" || req.user?.role === "icub") return true;
          if (req.user?.role === "theatre" && req.user?.venue) {
            return { id: { equals: req.user.venue } };
          }
          return false;
        },
        update: ({ req }) => {
          if (req.user?.role === "internal_admin") return true;
          if (req.user?.role === "theatre" && req.user?.venue) {
            return { id: { equals: req.user.venue } };
          }
          return false;
        },
        create: ({ req }) => req.user?.role === "internal_admin",
        delete: ({ req }) => req.user?.role === "internal_admin"
      },
      fields: [
        { name: "name", type: "text", required: true },
        { name: "district", type: "text", required: true },
        { name: "contactEmail", type: "email" },
        { name: "contactPhone", type: "text" },
        {
          name: "ticketingProvider",
          type: "select",
          required: true,
          defaultValue: "internal",
          options: ["internal", "onebox", "koobin", "janto", "redirect"]
        }
      ]
    },
    {
      slug: "activities",
      access: {
        read: () => true,
        update: ({ req }) => {
          if (req.user?.role === "internal_admin") return true;
          if (req.user?.role === "theatre" && req.user?.venue) {
            return { venue: { equals: req.user.venue } };
          }
          return false;
        },
        create: ({ req }) => req.user?.role === "internal_admin" || req.user?.role === "theatre",
        delete: ({ req }) => req.user?.role === "internal_admin"
      },
      fields: [
        { name: "venue", type: "relationship", relationTo: "venues", required: true },
        { name: "titleCa", type: "text", required: true },
        { name: "titleEs", type: "text", required: true },
        { name: "descriptionCa", type: "textarea" },
        { name: "descriptionEs", type: "textarea" },
        { name: "district", type: "text", required: true },
        { name: "discipline", type: "text", required: true },
        { name: "startsAt", type: "date", required: true },
        { name: "endsAt", type: "date" },
        { name: "capacity", type: "number", required: true, min: 1 },
        { name: "status", type: "select", defaultValue: "published", options: ["draft", "published"] }
      ]
    }
  ],
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts")
  }
});