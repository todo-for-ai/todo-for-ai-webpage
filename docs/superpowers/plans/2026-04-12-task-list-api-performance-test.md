# Task List API Performance Test Report

> Performance test for task list API with 100K tasks in project 1

**Date:** 2026-04-12
**Database:** MySQL 8.0, todo_for_ai, ~10M total tasks, 49,834 in project 1
**API Server:** Flask + Gunicorn, port 50110
**Backend Code:** `todo-for-ai-api-server/api/tasks/routes_tasks.py`

---

## Test Results Summary

### N+1 Query Status: FIXED

The task list API **does not have N+1 query issues**. Analysis of the code:
- Project information is batch-loaded via `Project.id.in_(project_ids)` into a `project_map` dict
- No lazy-loading of relationships in loops
- Uses `paginate_query_fast()` by default (avoids expensive COUNT queries)

### Performance Benchmarks (project_id=1, ~50K tasks)

| Test Scenario | First Request | Cached (avg) | Notes |
|--------------|---------------|--------------|-------|
| Basic list (page=1, per_page=20) | 15ms | 5-6ms | Redis cached |
| Status filter (todo) | 14ms | ~6ms | Uses idx_tasks_project_status |
| Status filter (in_progress) | 73ms | ~6ms | More rows to scan |
| COUNT query (include_total=true) | 96ms | 5ms | Redis cached after first |
| Deep pagination (page=5000) | 150ms | 5ms | OFFSET scan, then cached |
| Search query | 11ms | 5ms | Full-text search |
| Sort by priority | 24ms | 6ms | Uses idx_tasks_owner_priority |
| Large page size (100 items) | 16ms | 10ms | More data transfer |

### Database Indexes (verified)

The tasks table has well-designed composite indexes:
- `idx_tasks_project_status` (project_id, status) — for filtered queries
- `idx_tasks_project_created_at` (project_id, created_at) — for default sort
- `idx_tasks_project_updated_at` (project_id, updated_at) — for recent sort
- `idx_tasks_owner_priority_created_at` (owner_id, priority, created_at) — for priority sort
- And 8+ more covering various query patterns

### Caching Architecture

- **Redis caching** with in-memory fallback
- Cache key includes query parameters (project_id, status, page, per_page, sort)
- Fast pagination by default (LIMIT+1 pattern, no COUNT)
- COUNT only runs when `include_total=true` explicitly requested

---

## Conclusion

The task list API performance is **excellent** for a system with 10M+ tasks:
- Sub-10ms for most cached queries
- Sub-150ms for uncached deep pagination
- No N+1 query patterns detected
- Proper indexing for all common query patterns
- Redis caching effectively reduces repeated query latency

The former N+1 issue has been resolved through batch-loading project info and proper index design.
