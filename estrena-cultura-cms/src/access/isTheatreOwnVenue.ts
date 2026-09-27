import type { Access } from 'payload'

/** Lectura: internal_admin ve todo, icub ve todo (solo consulta), theatre ve solo la suya. */
export const canReadVenue: Access = ({ req }) => {
  if (req.user?.role === 'internal_admin' || req.user?.role === 'icub') return true

  if (req.user?.role === 'theatre' && req.user?.venue) {
    const venueId = typeof req.user.venue === 'object' ? req.user.venue.id : req.user.venue
    return { id: { equals: venueId } }
  }

  return false
}

/** Escritura: internal_admin puede todo, theatre solo la suya, icub nunca. */
export const canUpdateOwnVenue: Access = ({ req }) => {
  if (req.user?.role === 'internal_admin') return true

  if (req.user?.role === 'theatre' && req.user?.venue) {
    const venueId = typeof req.user.venue === 'object' ? req.user.venue.id : req.user.venue
    return { id: { equals: venueId } }
  }

  return false
}

/** Misma lógica que canUpdateOwnVenue pero comparando el campo "venue" en vez de "id" (para Activities). */
export const canUpdateOwnVenueActivities: Access = ({ req }) => {
  if (req.user?.role === 'internal_admin') return true

  if (req.user?.role === 'theatre' && req.user?.venue) {
    const venueId = typeof req.user.venue === 'object' ? req.user.venue.id : req.user.venue
    return { venue: { equals: venueId } }
  }

  return false
}