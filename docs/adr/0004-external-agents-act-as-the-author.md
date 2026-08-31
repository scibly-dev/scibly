# External agents act as the author

External MCP agents authenticate as an existing user (OAuth via better-auth's
mcp plugin) and hold exactly that author's permissions — there is no machine
principal, service account, or agent-specific role. We chose this over an
org-scoped service identity because the entire authorization and entitlement
stack keys off a user session; a second principal type would duplicate that
stack for no stated need, and every external action stays attributable to a
person. If unattended org-level automation ever needs an identity no person
holds, that is a new decision, not an extension of this one.
