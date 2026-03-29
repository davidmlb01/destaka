import { Queue, Worker } from 'bullmq'
import { Redis } from '@upstash/redis'

const connection = {
  host: process.env.UPSTASH_REDIS_REST_URL!.replace('https://', ''),
  port: 443,
  password: process.env.UPSTASH_REDIS_REST_TOKEN!,
  tls: {},
}

export const diagnosticQueue = new Queue('diagnostic', { connection })
export const optimizationQueue = new Queue('optimization', { connection })
export const postsQueue = new Queue('posts', { connection })

export type DiagnosticJobData = {
  profileId: string
  userId: string
}

export type OptimizationJobData = {
  profileId: string
  diagnosticId: string
  actions: string[]
}

export type PostJobData = {
  profileId: string
  postId: string
}
