# Known Issues

| ID | Severity | Issue | Impact | Workaround | Status |
|---|---|---|---|---|---|
| KI-001 | High | Client-side push architecture not production-safe | Security/abuse risk if enabled | Keep `EXPO_PUBLIC_ENABLE_CLIENT_PUSH=false`; implement backend sender | Open |
| KI-002 | Medium | Dependency vulnerabilities in expo-firebase-recaptcha chain | Security posture warning | Plan package migration/upgrade path | Open |
| KI-003 | Low | Navigation typing uses `as never` in places | Type-safety debt | Introduce typed nav param list | Open |
| KI-004 | Low | Roster non-self names may be placeholder in Home live view | UX quality | Enrich roster from team member profile map | Open |
