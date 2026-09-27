import {
  withSupabase,
} from 'npm:@supabase/server@1.8.0';

import nodemailer from 'npm:nodemailer@9.1.1';

const SMTP_HOSTNAME =
  Deno.env.get('SMTP_HOSTNAME');

const SMTP_PORT =
  Deno.env.get('SMTP_PORT');

const SMTP_SECURE =
  Deno.env.get('SMTP_SECURE');

const SMTP_USERNAME =
  Deno.env.get('SMTP_USERNAME');

const SMTP_PASSWORD =
  Deno.env.get('SMTP_PASSWORD');

const SMTP_FROM =
  Deno.env.get('SMTP_FROM');

const SUPPORT_EMAIL =
  Deno.env.get('SUPPORT_EMAIL');

function sanitizeSubject(
  value: string
) {
  return value
    .replace(/[\r\n]+/g, ' ')
    .trim();
}

function getTransport() {
  if (
    !SMTP_HOSTNAME ||
    !SMTP_PORT ||
    !SMTP_USERNAME ||
    !SMTP_PASSWORD ||
    !SMTP_FROM ||
    !SUPPORT_EMAIL
  ) {
    throw new Error(
      'SMTP-konfiguration mangler.'
    );
  }

  return nodemailer.createTransport({
    host: SMTP_HOSTNAME,

    port: Number(
      SMTP_PORT
    ),

    secure:
      SMTP_SECURE === 'true',

    auth: {
      user:
        SMTP_USERNAME,

      pass:
        SMTP_PASSWORD,
    },
  });
}

export default {
  fetch: withSupabase(
    {
      auth: 'user',
    },

    async (
      req,
      ctx
    ) => {
      if (
        req.method !== 'POST'
      ) {
        return Response.json(
          {
            error:
              'Metoden er ikke tilladt.',
          },
          {
            status: 405,
          }
        );
      }

      try {
        const body =
          await req.json();

        const subject =
          typeof body?.subject ===
          'string'
            ? sanitizeSubject(
                body.subject
              )
            : '';

        const message =
          typeof body?.message ===
          'string'
            ? body.message.trim()
            : '';

        if (!subject) {
          return Response.json(
            {
              error:
                'Emne mangler.',
            },
            {
              status: 400,
            }
          );
        }

        if (!message) {
          return Response.json(
            {
              error:
                'Besked mangler.',
            },
            {
              status: 400,
            }
          );
        }

        if (
          subject.length > 120
        ) {
          return Response.json(
            {
              error:
                'Emnet er for langt.',
            },
            {
              status: 400,
            }
          );
        }

        if (
          message.length > 5000
        ) {
          return Response.json(
            {
              error:
                'Beskeden er for lang.',
            },
            {
              status: 400,
            }
          );
        }

        const userEmail =
          ctx.userClaims?.email;

        const userId =
          ctx.userClaims?.id;

        if (!userEmail) {
          return Response.json(
            {
              error:
                'Brugerens e-mail kunne ikke findes.',
            },
            {
              status: 401,
            }
          );
        }

        const transport =
          getTransport();

        await transport.sendMail({
          from: `ProtoGo Support <${SMTP_FROM}>`,

          to:
            SUPPORT_EMAIL,

          replyTo:
            userEmail,

          subject:
            `[ProtoGo Support] ${subject}`,

          text: [
            'Ny supportbesked fra ProtoGo',
            '',
            `Bruger: ${userEmail}`,
            `Bruger-ID: ${userId ?? 'Ukendt'}`,
            '',
            `Emne: ${subject}`,
            '',
            'Besked:',
            message,
          ].join('\n'),
        });

        return Response.json({
          success: true,
        });
      } catch (error) {
        console.error(
          'Kunne ikke sende supportmail:',
          error
        );

        return Response.json(
          {
            error:
              'Supportbeskeden kunne ikke sendes.',
          },
          {
            status: 500,
          }
        );
      }
    }
  ),
};