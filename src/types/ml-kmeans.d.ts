declare module 'ml-kmeans' {
  export interface KMeansResult {
    clusters: number[];
    centroids: number[][];
  }

  export default function kmeans(
    data: number[][],
    k: number
  ): KMeansResult;
}
