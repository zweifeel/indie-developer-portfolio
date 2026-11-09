/**
 * ============================================================================
 * SLEEPYKOALA CMS — PUBLIC PROJECT PROGRESS API ENDPOINT
 * Route: /api/projects/:slug/progress
 * 
 * Serves canonical progress metadata projected strictly through extractPublicProgress().
 * Strict Privacy & Public Whitelist Projection:
 * - Only items with publicationStatus === 'public' are included.
 * - Draft, Review, and Hidden items are completely excluded.
 * - Zero git hashes, zero internal branch names, zero local file paths, zero secrets.
 * - Fail-Closed: If backend is unavailable, returns HTTP 503 (no-store, no-cache).
 * - Cache-Control: no-cache, must-revalidate (RFC 9111).
 * ============================================================================
 */

import {
  AuthEnv,
  SECURITY_HEADERS,
  callGasBackend,
} from '../../admin/auth/utils';

import {
  extractPublicProgress,
} from '../../../../src/services/portfolioMetadataValidator';

import {
  fetchPublicProjectProgress,
} from '../../../../src/services/cmsProgressService';

export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, {
    status: 204,
    headers: SECURITY_HEADERS,
  });
};

export const onRequestGet = async (context: {
  request: Request;
  params: { slug: string };
  env: AuthEnv;
}): Promise<Response> => {
  const { params, env } = context;
  const slug = params.slug ? String(params.slug).trim().toLowerCase() : '';

  if (!slug || !/^[a-z0-9-_]+$/.test(slug)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'INVALID_PROJECT_SLUG',
        message: 'Format slug proyek tidak valid.',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  }

  // 1. In production / live integration, query GAS backend CMS_GET_PROJECT_PROGRESS if configured
  if (env.GAS_WEBAPP_URL && env.GAS_WEBAPP_URL.startsWith('https://script.google.com/')) {
    try {
      const gasResult = await callGasBackend(env, 'CMS_GET_PROJECT_PROGRESS', {
        projectSlug: slug,
        isPublicOnly: true,
      });

      if (gasResult.status === 200 && gasResult.body?.success && gasResult.body.data) {
        // Double-check projection server-side to guarantee fail-closed boundary
        const rawDoc = gasResult.body.data;
        const publicData = extractPublicProgress(rawDoc);

        return new Response(
          JSON.stringify({
            success: true,
            data: publicData,
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json; charset=UTF-8',
              'Cache-Control': 'no-cache, must-revalidate',
              'X-Content-Type-Options': 'nosniff',
            },
          }
        );
      }

      if (gasResult.status === 404 || gasResult.body?.error === 'NOT_FOUND') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'NOT_FOUND',
            message: 'Progress proyek belum tersedia atau belum dipublikasikan.',
          }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json; charset=UTF-8',
              'Cache-Control': 'no-store, no-cache, must-revalidate',
              'X-Content-Type-Options': 'nosniff',
            },
          }
        );
      }

      // If upstream failed or returned 5xx, fail-closed 503
      return new Response(
        JSON.stringify({
          success: false,
          error: 'UPSTREAM_UNAVAILABLE',
          message: 'Layanan progress proyek sementara tidak tersedia.',
        }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Content-Type-Options': 'nosniff',
          },
        }
      );
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'GATEWAY_ERROR',
          message: 'Gagal terhubung ke backend upstream CMS.',
        }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Content-Type-Options': 'nosniff',
          },
        }
      );
    }
  }

  // 2. Decoupled / local fallback: query local canonical in-memory progress projection
  const localResult = await fetchPublicProjectProgress(slug);
  if (localResult.success && localResult.data) {
    return new Response(
      JSON.stringify({
        success: true,
        data: localResult.data,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Cache-Control': 'no-cache, must-revalidate',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  }

  return new Response(
    JSON.stringify({
      success: false,
      error: 'NOT_FOUND',
      message: 'Progress proyek tidak ditemukan.',
    }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    }
  );
};
