import * as Bull from 'bull'
import { logger } from '../../../helpers/logger'
import { fetchVideoByUrl } from '../../../helpers/video'
import { refreshVideoIfNeeded, refreshActorIfNeeded } from '../../activitypub'
import { ActorModel } from '../../../models/activitypub/actor'

export type RefreshPayload = {
  type: 'video' | 'actor'
  url: string
}

async function refreshAPObject (job: Bull.Job) {
  const payload = job.data as RefreshPayload

  logger.info('Processing AP refresher in job %d for %s.', job.id, payload.url)

  if (payload.type === 'video') return refreshVideo(payload.url)
  if (payload.type === 'actor') return refreshActor(payload.url)
}

// ---------------------------------------------------------------------------

export {
  refreshActor,
  refreshAPObject
}

// ---------------------------------------------------------------------------

async function refreshVideo (videoUrl: string) {
  const fetchType = 'all' as 'all'
  const syncParam = { likes: true, dislikes: true, shares: true, comments: true, thumbnail: true }

  const videoFromDatabase = await fetchVideoByUrl(videoUrl, fetchType)
  if (videoFromDatabase) {
    const refreshOptions = {
      video: videoFromDatabase,
      fetchedType: fetchType,
      syncParam
    }

    await refreshVideoIfNeeded(refreshOptions)
  }
}

async function refreshActor (actorUrl: string) {
  const fetchType = 'all' as 'all'
  const actor = await ActorModel.loadByUrlAndPopulateAccountAndChannel(actorUrl)

  if (actor) {
    await refreshActorIfNeeded(actor, fetchType)
  }

}
