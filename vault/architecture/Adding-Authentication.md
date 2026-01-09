# Adding Authentication to FloImg Studio

FloImg Studio is designed as a **pure, single-user application** with no authentication built in. This is intentional - it keeps the OSS codebase simple and allows maximum flexibility for how you deploy it.

## Why No Built-in Auth?

1. **Simplicity**: Single-user mode requires no user management, sessions, or permissions
2. **Flexibility**: You choose the auth solution that fits your infrastructure
3. **Composability**: Auth wraps Studio rather than being embedded in it
4. **Maintenance**: No auth code means no auth bugs or security patches in core

## The Wrapper Pattern

To add authentication, you **wrap** FloImg Studio behind an authentication layer rather than modifying it. This keeps your deployment separate from the upstream OSS codebase.

```
Internet → Auth Layer → FloImg Studio
```

The auth layer:

1. Handles authentication (login, session management)
2. Proxies requests to Studio only after successful auth
3. Can optionally inject user context via headers

## Example Architectures

### 1. Nginx Basic Auth (Simplest)

For internal tools or small teams:

```nginx
server {
    listen 80;
    server_name studio.example.com;

    auth_basic "FloImg Studio";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Create the password file:

```bash
htpasswd -c /etc/nginx/.htpasswd admin
```

### 2. OAuth Proxy (Production)

Use [OAuth2 Proxy](https://oauth2-proxy.github.io/oauth2-proxy/) for Google/GitHub/etc:

```yaml
# docker-compose.yml
services:
  oauth-proxy:
    image: quay.io/oauth2-proxy/oauth2-proxy
    environment:
      OAUTH2_PROXY_PROVIDER: github
      OAUTH2_PROXY_CLIENT_ID: ${GITHUB_CLIENT_ID}
      OAUTH2_PROXY_CLIENT_SECRET: ${GITHUB_CLIENT_SECRET}
      OAUTH2_PROXY_COOKIE_SECRET: ${COOKIE_SECRET}
      OAUTH2_PROXY_UPSTREAMS: http://studio:5173
      OAUTH2_PROXY_EMAIL_DOMAINS: "*"
    ports:
      - "80:4180"
    depends_on:
      - studio

  studio:
    image: ghcr.io/teamflojo/floimg-studio:latest
    expose:
      - "5173"
```

### 3. Custom Fastify Wrapper (Full Control)

For custom auth logic, multi-tenant, or enterprise SSO:

```typescript
// server.ts
import Fastify from "fastify";
import fastifyHttpProxy from "@fastify/http-proxy";

const fastify = Fastify();

// Your auth middleware
fastify.addHook("preHandler", async (request, reply) => {
  const session = await validateSession(request.headers.cookie);
  if (!session) {
    return reply.redirect("/login");
  }
  // Optionally inject user context
  request.headers["x-user-id"] = session.userId;
});

// Proxy to Studio
await fastify.register(fastifyHttpProxy, {
  upstream: "http://localhost:5173",
  prefix: "/",
});

await fastify.listen({ port: 3000 });
```

### 4. Enterprise SSO (SAML/OIDC)

For corporate environments, use a dedicated identity provider:

```
Internet → Cloudflare Access → FloImg Studio
                  ↓
            (SAML/OIDC)
                  ↓
           Corporate IdP (Okta, Azure AD, etc.)
```

Options:

- [Cloudflare Access](https://www.cloudflare.com/products/zero-trust/access/)
- [Authentik](https://goauthentik.io/)
- [Keycloak](https://www.keycloak.org/)

## User Context (Optional)

If you need to identify users within Studio (e.g., for audit logs), pass context via headers:

```typescript
// In your auth proxy
request.headers["x-user-id"] = session.userId;
request.headers["x-user-email"] = session.email;
```

Studio currently doesn't use these headers, but you can fork and add that functionality if needed.

## Multi-Tenant Considerations

For SaaS deployments with multiple organizations:

1. **Separate instances**: Run one Studio instance per tenant (simplest, good isolation)
2. **Shared instance with routing**: Use path prefixes or subdomains to route to tenant-specific storage
3. **Full multi-tenant**: Fork Studio and add tenant awareness

## Production Checklist

Before deploying with auth:

- [ ] HTTPS enabled (required for secure cookies)
- [ ] Session cookies configured correctly
- [ ] CORS configured if API calls cross origins
- [ ] Rate limiting on auth endpoints
- [ ] Audit logging for access events
- [ ] Backup strategy for user data

## What About FloImg Studio Cloud?

[FloImg Studio Cloud](https://studio.floimg.com) uses this exact wrapper pattern - it's a proprietary wrapper around the OSS Studio that adds authentication, billing, and cloud storage. This proves the pattern works at scale.

If you want multi-user auth without building it yourself, Studio Cloud is available as a managed service.

## Need Help?

- [GitHub Discussions](https://github.com/TeamFlojo/floimg/discussions) - Ask questions
- [Discord](https://floimg.com/discord) - Chat with the community
- [Enterprise Support](mailto:enterprise@floimg.com) - For organizations needing custom solutions
