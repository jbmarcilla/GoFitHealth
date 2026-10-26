export default defineEventHandler((event) => {
  if (handleOAuthCors(event)) return null
  const origin = siteOrigin(event)
  return {
    resource: `${origin}/mcp`,
    authorization_servers: [origin],
    bearer_methods_supported: ['header'],
    scopes_supported: [OAUTH_SCOPE],
    resource_name: 'GoFit Health',
  }
})
