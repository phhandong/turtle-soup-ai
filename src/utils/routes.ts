export function getStoryPath(storyId: string): string {
  return `#/story/${storyId}`;
}

export function getCurrentStoryId(): string | null {
  const match = window.location.hash.match(/^#\/story\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
