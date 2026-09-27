import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { isInternalAdmin } from '../../access/isInternalAdmin'
import { canUpdateOwnVenueActivities } from '../../access/isTheatreOwnVenue'

export const Activities: CollectionConfig = {
  slug: 'activities',
  access: {
    admin: authenticated,
    read: authenticated,
    create: ({ req }) =>
      req.user?.role === 'internal_admin' || req.user?.role === 'theatre',
    update: canUpdateOwnVenueActivities,
    delete: isInternalAdmin,
  },
  admin: {
    defaultColumns: ['titleCa', 'venue', 'startsAt', 'status'],
    useAsTitle: 'titleCa',
  },
  fields: [
    { name: 'venue', type: 'relationship', relationTo: 'venues', required: true },
    { name: 'titleCa', type: 'text', required: true },
    { name: 'titleEs', type: 'text', required: true },
    { name: 'descriptionCa', type: 'textarea' },
    { name: 'descriptionEs', type: 'textarea' },
    { name: 'district', type: 'text', required: true },
    { name: 'discipline', type: 'text', required: true },
    { name: 'startsAt', type: 'date', required: true },
    { name: 'endsAt', type: 'date' },
    { name: 'capacity', type: 'number', required: true, min: 1 },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: ['draft', 'published'],
    },
  ],
  timestamps: true,
}