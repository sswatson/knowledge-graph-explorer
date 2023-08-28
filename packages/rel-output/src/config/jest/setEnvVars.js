process.env.NEXT_PUBLIC_BASE_URL = 'base-url';
process.env.NEXT_PUBLIC_CONSOLE_SERVICES_ORIGIN = 'console-services';
process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN = 'dd_token';
process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID = 'dd_app';
process.env.NEXT_PUBLIC_DATADOG_ENV = 'dd_env';
process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA = 'vercel_sha';

// Needed for <Link>, it's on Next.js by default, but not in tests
process.env.__NEXT_NEW_LINK_BEHAVIOR = 'true';
