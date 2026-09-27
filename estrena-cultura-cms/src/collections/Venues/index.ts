import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { isInternalAdmin } from '../../access/isInternalAdmin'
import { canReadVenue, canUpdateOwnVenue } from '../../access/isTheatreOwnVenue'

export const Venues: CollectionConfig = {
  slug: 'venues',
  access: {
    admin: authenticated,
    create: isInternalAdmin,
    delete: isInternalAdmin,
    read: canReadVenue,
    update: canUpdateOwnVenue,
  },
  admin: {
    defaultColumns: ['name', 'district', 'ticketingProvider'],
    useAsTitle: 'name',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'district', type: 'text', required: true },
    { name: 'contactEmail', type: 'email' },
    { name: 'contactPhone', type: 'text' },
    {
      name: 'ticketingProvider',
      type: 'select',
      required: true,
      defaultValue: 'internal',
      options: ['internal', 'onebox', 'koobin', 'janto', 'redirect'],
    },
  ],
  timestamps: true,
}