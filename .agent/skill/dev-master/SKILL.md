---
name: dev skill
description: A specialized skill focused on end-to-end software development, advanced debugging, and infrastructure stability. This skill prioritizes Production Environment reliability and Security Best Practices to ensure code is not only functional but resilient, scalable, and protected against vulnerabilities and secure code.
---

## When to use this skill

- Production Debugging: When identifying and fixing critical bugs in live environments where downtime must be minimized
- Security Audits: When reviewing code for common vulnerabilities (OWASP Top 10) or implementing authentication and data encryption.

- System Architecture: When designing backend systems that require high availability, efficient database indexing, and secure API communication.

- Performance Optimization: When code needs to be refactored for better resource management, faster execution, or lower memory footprint.



## How to use it    
1. The "Production-First" Mindset
Log Everything: Ensure all critical paths have structured logging (e.g., JSON logs) to make debugging in production feasible without local access.

Error Handling: Never let a process crash silently. Use global error handlers and ensure sensitive system information is not leaked in API responses.

Environment Parity: Always verify that code behaves consistently across Dev, Staging, and Production environments.

2. Secure Coding Standards
Input Validation: Sanitize and validate all incoming data. Use parameterized queries (Prepared Statements) to prevent SQL Injection.

Least Privilege: Implement Role-Based Access Control (RBAC) and ensure services only have the permissions they absolutely need.

Secret Management: Never hardcode API keys or credentials. Use environment variables or dedicated secret managers (e.g., Vault, AWS Secrets Manager).

3. Debugging & Maintenance Workflow
Isolate: Use monitoring tools and logs to pinpoint the failure point without affecting other services.

Reproduce: Create a test case that mimics the production failure.

Fix & Verify: Implement the fix, then verify with automated tests (Unit/Integration) to prevent regression.

Monitor: After deployment, closely observe system metrics to ensure the fix is stable.

4. Database & Performance
Optimize SQL queries by analyzing execution plans.

Ensure proper indexing for frequently queried columns.

Implement caching strategies (e.g., Redis) where appropriate to reduce database load.