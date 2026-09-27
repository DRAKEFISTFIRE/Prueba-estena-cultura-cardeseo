import type { Access } from 'payload'

export const isInternalAdmin: Access = ({ req }) => {
  return req.user?.role === 'internal_admin'
}