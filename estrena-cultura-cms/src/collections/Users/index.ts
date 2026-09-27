import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { isInternalAdmin } from '../../access/isInternalAdmin'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: isInternalAdmin,
    delete: isInternalAdmin,
    read: authenticated,
    update: isInternalAdmin,
  },
  admin: {
    defaultColumns: ['name', 'email', 'role'],
    useAsTitle: 'name',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'theatre',
      options: [
        { label: 'Teatre', value: 'theatre' },
        { label: 'ICUB (només lectura)', value: 'icub' },
        { label: 'Administració interna', value: 'internal_admin' },
      ],
    },
    {
      name: 'venue',
      type: 'relationship',
      relationTo: 'venues',
      admin: {
        condition: (_data, siblingData) => siblingData?.role === 'theatre',
        description: 'Obligatori si el rol és "Teatre" — determina a quina venue té accés.',
      },
    },
  ],
  timestamps: true,
}