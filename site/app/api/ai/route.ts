import { env } from 'cloudflare:workers';
import { handleAI } from '../../../lib/ai-service.mjs';
export const dynamic = 'force-dynamic';
export function GET(request: Request) { return handleAI(request, env); }
export function POST(request: Request) { return handleAI(request, env); }
