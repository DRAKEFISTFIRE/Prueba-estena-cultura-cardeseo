import type { Access } from "payload";

export const isAuthenticated: Access = ({ req }) => Boolean(req.user);

export const isInternalAdmin: Access = ({ req }) => {
  const user = req.user as { role?: string } | undefined;
  return user?.role === "internal_admin";
};

export const isVenue: Access = ({ req }) => {
  const user = req.user as { role?: string } | undefined;
  return user?.role === "venue";
};

export const isIcubReadOnly: Access = ({ req }) => {
  const user = req.user as { role?: string } | undefined;
  return user?.role === "icub";
};
