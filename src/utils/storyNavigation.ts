import { stories } from '../data/stories'
import { getStoryPath } from './routes'

function getUnrevealedStories(
  completedStoryIds: Set<string>,
  excludedStoryId?: string,
) {
  return stories.filter(
    (candidate) =>
      candidate.id !== excludedStoryId && !completedStoryIds.has(candidate.id),
  )
}

export function openRandomUnrevealedStory(
  completedStoryIds: Set<string>,
  excludedStoryId?: string,
) {
  const unrevealedStories = getUnrevealedStories(
    completedStoryIds,
    excludedStoryId,
  )
  const fallbackStories = excludedStoryId
    ? stories.filter((candidate) => candidate.id !== excludedStoryId)
    : stories
  const candidateStories =
    unrevealedStories.length > 0 ? unrevealedStories : fallbackStories
  if (candidateStories.length === 0) {
    return
  }

  const randomStory =
    candidateStories[Math.floor(Math.random() * candidateStories.length)]

  window.location.href = getStoryPath(randomStory.id)
}
