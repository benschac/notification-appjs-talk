# tRPC Backend Refactor Plan

## Overview

This document outlines a 7-phase plan to refactor the tRPC backend routes, breaking down massive router files into manageable, maintainable code. The refactor addresses files ranging from 300-3000+ lines by extracting business logic, creating shared utilities, implementing proper separation of concerns, and fixing timezone handling issues.

**Key Principles:**

- Keep it simple - avoid over-engineering
- Extract services for business logic, not repositories for every query
- Use a lightweight event bus for notifications, not event sourcing
- Maintain existing patterns that work well (like your join tables)
- Standardize timezone handling to prevent user confusion

#### Type Reuse Strategy

**Before creating any new types, always check:**

1. **Generated Types** (`/supabase/types.ts`)

   - Database table types
   - Relationship types
   - Enum definitions

2. **Shared Types** (`/packages/api/src/shared/types.ts`)

   - Common interfaces
   - Service contracts
   - Domain types

3. **Existing Router Types**
   - Input/output schemas from Zod
   - Procedure types
   - Response types

**Only create new types when:**

- No existing type covers the use case
- Composing existing types would be overly complex
- Domain-specific business logic requires new abstractions

#### LLM Prompt

```
Extract business logic from my-treasures/receiving.ts into separate service files following the detailed service structure outlined above. Start with the AddressResolutionService as it's the simplest, then move to more complex services. Maintain all existing functionality while improving code organization.

IMPORTANT: Before creating any new types or interfaces:
1. Check /supabase/types.ts for database types
2. Check /packages/api/src/shared/types.ts for existing shared types
3. Review existing router Zod schemas for input/output types
4. Reuse or extend existing types rather than creating duplicates
5. Only create new types when absolutely necessary

Reference existing types by importing them properly. Prefer composition and extension over recreation.
```

## Current State Analysis

### Largest Problem Files

- **`my-treasures/receiving.ts`** - 3,068 lines (extremely complex)
- **`my-treasures/giving/index.ts`** - 1,430 lines (very complex)
- **`me.ts`** - 1,432 lines (very complex)
- **`chooseARecipient.ts`** - 593 lines (moderately complex)
- **`notifications.ts`** - 551 lines (moderately complex)

### Key Issues

- 360+ TRPCError instances with repeated patterns
- 305+ direct Supabase queries lacking abstraction
- Complex business logic embedded in router procedures
- Repeated validation schemas across files
- Monolithic files mixing multiple domains

## Refactor Phases

### ✅ Phase 1: Foundation - Shared Utilities

**Estimated Time**: 2-4 hours  
**Priority**: High  
**Status**: Complete  
**Actual Time**: 1 hour

#### Objectives

- Create reusable validation schemas
- Standardize error handling
- Establish common TypeScript interfaces
- Add simple event emitter for decoupling side effects

#### Tasks

- [x] Create `/packages/api/src/shared/schemas.ts`
  - Common Zod schemas (UUID validation, pagination, etc.)
  - Extract patterns like `z.string().uuid()` used 300+ times
- [x] Create `/packages/api/src/shared/errors.ts`
  - Standardized error factories for NOT_FOUND, FORBIDDEN, etc.
  - Reduce boilerplate from 360+ TRPCError instances
- [x] Create `/packages/api/src/shared/types.ts`
  - Common TypeScript interfaces and types
- [x] Create `/packages/api/src/events/simple-event-bus.ts`
  - Lightweight event emitter for notifications and side effects
  - Type-safe event definitions
  - No event sourcing complexity
- [x] Update 2-3 small router files as proof of concept

#### LLM Prompt

```
Create shared validation schemas and error handling utilities for tRPC routes. Extract the most common patterns like UUID validation, pagination, and standard errors from the existing router files. Also create a simple event bus (not event sourcing) for handling notifications and side effects.
```

#### Success Criteria

- Shared schemas exported and documented
- Error factories cover common error patterns
- 2-3 router files successfully using new utilities
- No breaking changes to API contracts

---

### Phase 1.1: Standardize Error Handling

**Estimated Time**: 1-2 hours  
**Priority**: High  
**Status**: Pending

#### Objectives

- Replace all direct TRPCError instances with standardized error factories
- Ensure consistent error messages and codes across the API
- Reduce boilerplate from 360+ TRPCError instances
- Prepare clean error handling for subsequent service extractions

#### Tasks

- [ ] Identify the most common error patterns across router files
- [ ] Create factory functions for standard errors (NOT_FOUND, FORBIDDEN, BAD_REQUEST, etc.)
- [ ] Replace direct `new TRPCError(...)` usage with factories in 3-5 representative files
- [ ] Verify error responses remain unchanged (manual check or unit tests)
- [ ] Gradually roll out to remaining router files

#### Target Error Factories

```typescript
// /packages/api/src/shared/errors.ts
export const createNotFoundError = (resource: string) =>
  new TRPCError({
    code: "NOT_FOUND",
    message: `${resource} not found`,
  });

export const createForbiddenError = (action?: string) =>
  new TRPCError({
    code: "FORBIDDEN",
    message: action ? `Not authorized to ${action}` : "Access denied",
  });
```

#### LLM Prompt

```
Analyze existing TRPCError usage patterns and create standardized error factory functions. Replace direct error instantiation with these factories while maintaining exact same error codes and messages.
```

#### Success Criteria

- All error patterns have corresponding factory functions
- Error responses remain unchanged
- 50%+ reduction in TRPCError boilerplate
- Clean foundation for service extraction phases

---

### Phase 2: Extract Receiving Services (Detailed)

**Estimated Time**: 4-6 hours  
**Priority**: High  
**Status**: Pending

#### Current File Analysis

The receiving router contains **42 procedures** across 3,068 lines with several major domains:

1. **Pickup Management** (Lines 150-494, 2475-2660)

   - `onMyWay`, `getFullPickupInfo`, `markPickupAsTaken`
   - Complex address resolution logic with multiple fallbacks
   - Pickup status transitions

2. **Pickup Scheduling** (Lines 2184-2474)

   - `getScheduledPickups` - Very complex query with multiple joins
   - Handles pickup groups, items, gifts, profiles, landmarks
   - Contains cleanup logic for empty pickup groups

3. **Interest Management** (Lines 495-863, 1645-1793)

   - `removeScheduledItemInterest`, `removeInterest`
   - Complex state management for item interest
   - Email notification triggers

4. **Item Selection** (Lines 868-1254)

   - `getMyInterestedGiftItems`, `getGiftsWithMyChosenItems`
   - Complex queries with pagination
   - Inconsistency cleanup logic

5. **Gift Queries** (Lines 1960-2183)
   - Various gift counting and fetching procedures
   - Complex filtering based on user selection status

#### Objectives

- Break down `my-treasures/receiving.ts` (3,068 lines)
- Extract complex business logic into 6 focused services
- Maintain API contracts while improving maintainability
- Improve testability and code organization

#### Tasks

- [ ] Create `/packages/api/src/services/receiving/` directory structure
- [ ] Extract pickup management operations into `pickup-management.service.ts`
- [ ] Extract scheduling logic into `pickup-scheduling.service.ts`
- [ ] Extract interest management into `interest-management.service.ts`
- [ ] Extract item selection logic into `item-selection.service.ts`
- [ ] Extract notification orchestration into `notification.service.ts`
- [ ] Extract address resolution logic into `address-resolution.service.ts`
- [ ] Create service interfaces and types
- [ ] **Update `createTRPCContext` in `packages/api/src/trpc.ts` to instantiate new services**
- [ ] Update router to use extracted services via context (`ctx.service.{serviceName}`)
- [ ] Add unit tests for extracted services

#### Target Services

```
/packages/api/src/services/receiving/
├── pickup-management.service.ts    # Core pickup operations (~200 lines)
├── pickup-scheduling.service.ts    # Scheduling and time management (~150 lines)
├── interest-management.service.ts  # Item interest operations (~100 lines)
├── item-selection.service.ts       # Item selection and recipient matching (~120 lines)
├── notification.service.ts         # Email/push notification orchestration (~80 lines)
├── address-resolution.service.ts   # Complex address lookup logic (~50 lines)
├── types.ts                       # Service interfaces and types
└── index.ts                       # Service exports
```

#### Service Details

##### 1. **PickupManagementService** (~800 lines → ~200 lines)

```typescript
// Responsibilities:
- updatePickupStatus(pickupGroupId, status, userId)
- getPickupDetails(pickupGroupId, userId)
- cancelPickup(pickupGroupId, userId)
- markPickupAsTaken(pickupGroupId, userId)

// Complex logic to extract:
- Address resolution with 3-level fallback (lines 70-391)
- Pickup group validation and authorization
- Item status transitions during pickup lifecycle
```

##### 2. **PickupSchedulingService** (~600 lines → ~150 lines)

```typescript
// Responsibilities:
- schedulePickup(giftId, itemIds, scheduledTime, userId)
- getScheduledPickups(userId, limit, cursor)
- cleanupEmptyPickupGroups()

// Complex logic to extract:
- Multi-table join query assembly (lines 2197-2344)
- Pagination with scheduled_time cursor
- Background cleanup of empty pickup groups
```

##### 3. **InterestManagementService** (~400 lines → ~100 lines)

```typescript
// Responsibilities:
- expressInterest(itemId, userId)
- removeInterest(itemId, userId, isScheduled)
- removeScheduledItemInterest(itemId, userId)
- getInterestedItems(userId, limit, cursor)

// Complex logic to extract:
- Cascading updates when removing interest
- Pickup group deletion when no items remain
- State consistency between items and item_interest tables
```

##### 4. **ItemSelectionService** (~500 lines → ~120 lines)

```typescript
// Responsibilities:
- getItemsSelectedForUser(userId, status)
- getGiftsWithChosenItems(userId, limit, cursor)
- cleanupInconsistentSelections(userId)

// Complex logic to extract:
- Inconsistent state detection and cleanup (lines 968-1010)
- Complex gift aggregation with pickup info
- Multi-stage query for chosen items
```

##### 5. **NotificationService** (~300 lines → ~80 lines)

```typescript
// Responsibilities:
- notifyPickupCancellation(gifter, receiver, giftName, items)
- notifyInterestRemoved(gifter, receiver, giftName, item)
- notifyPickupCompleted(gifter, receiver, giftName, items)

// Integration with:
- Existing email services (sendPickupCancellationEmail, etc.)
- Push notification payload construction
- User profile fetching for notifications
```

##### 6. **AddressResolutionService** (~200 lines → ~50 lines)

```typescript
// Responsibilities:
- resolvePickupAddress(pickupGroupId, giftId, userId)
- getAddressWithFallbacks(addressId, profileId, giftId)

// Complex logic to extract:
- 3-level fallback strategy:
  1. Pickup group address
  2. Gift address
  3. User default address
- Error handling for missing addresses
```

#### Migration Strategy

1. **Create Service Interfaces** (2 hours)

   - Define clear contracts for each service
   - Use dependency injection pattern for Supabase client
   - Create TypeScript interfaces for all service methods

2. **Extract Pure Business Logic** (3 hours)

   - Start with AddressResolutionService (simplest)
   - Move complex queries into service methods
   - Keep transaction boundaries in router

3. **Update Router Procedures & Context Integration** (1 hour)
   - Add new services to the `createTRPCContext` function in `packages/api/src/trpc.ts`
   - Replace inline logic with service calls via `ctx.service.{serviceName}`
   - Maintain exact same input/output contracts
   - Add proper error handling delegation

#### Key Challenges & Solutions

1. **Complex Queries**

   - Keep query building logic in services
   - Use query builder pattern for complex joins
   - Consider query result typing helpers

2. **Transaction Management**

   - Services should accept Supabase client
   - Let router handle transaction boundaries
   - Document which operations need transactions

3. **Error Handling**

   - Use standardized errors from Phase 1
   - Services throw domain-specific errors
   - Router catches and maps to TRPC errors

4. **Testing Strategy**
   - Mock Supabase client for unit tests
   - Test complex business logic in isolation
   - Integration tests for critical paths

#### LLM Prompt

```
Extract business logic from my-treasures/receiving.ts into separate service files following the detailed service structure outlined above. Start with the AddressResolutionService as it's the simplest, then move to more complex services. Maintain all existing functionality while improving code organization.

IMPORTANT:
1. Before creating any new types or interfaces:
   - Check /supabase/types.ts for database types
   - Check /packages/api/src/shared/types.ts for existing shared types
   - Review existing router Zod schemas for input/output types
   - Reuse or extend existing types rather than creating duplicates

2. Service Integration Pattern:
   - Add all new services to the `createTRPCContext` function in `packages/api/src/trpc.ts`
   - Use the existing service injection pattern under `ctx.service.{serviceName}`
   - Follow the conditional instantiation pattern for services requiring authentication
   - Update router procedures to access services via context instead of direct instantiation

Reference the existing service injection pattern in trpc.ts for consistency.
```

#### Success Criteria

- Router file reduced from 3,068 → ~800 lines
- Each service file < 200 lines
- 80%+ test coverage on extracted services
- Zero breaking changes to API
- Improved query performance through optimization
- Clear separation of concerns with focused services

---

### Phase 3: Extract Giving Services

**Estimated Time**: 4-6 hours  
**Priority**: High  
**Status**: Pending

#### Objectives

- Break down `my-treasures/giving/index.ts` (1,430 lines)
- Extract recipient selection and item management logic
- Create reusable giving-related services

#### Tasks

- [ ] Create `/packages/api/src/services/giving/` directory
- [ ] Extract recipient selection logic into `recipient.service.ts`
- [ ] Extract item management operations into `item.service.ts`
- [ ] Extract pickup confirmation procedures into `confirmation.service.ts`
- [ ] Create giving workflow orchestration in `workflow.service.ts`
- [ ] Create service interfaces and types
- [ ] **Update `createTRPCContext` in `packages/api/src/trpc.ts` to instantiate new giving services**
- [ ] Update router to use extracted services via context (`ctx.service.{serviceName}`)
- [ ] Add comprehensive error boundaries

#### Target Services

```
/services/giving/
├── recipient.service.ts     # Recipient selection logic
├── item.service.ts          # Item management
├── confirmation.service.ts  # Pickup confirmations
├── workflow.service.ts      # Giving workflow orchestration
├── types.ts                # Service interfaces
└── index.ts                # Service exports
```

#### Context Integration

```typescript
// In createTRPCContext function (packages/api/src/trpc.ts)
service: {
  // Existing services...

  // Giving services
  recipient: new RecipientService({ supabase, userId }),
  givingItem: new GivingItemService({ supabase, userId }),
  pickupConfirmation: new PickupConfirmationService({ supabase, userId }),
  givingWorkflow: new GivingWorkflowService({ supabase, userId }),
}

// Usage in router procedures
export const givingRouter = createTRPCRouter({
  selectRecipient: protectedProcedure
    .input(selectRecipientSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.service.recipient.selectRecipientForItem({
        ...input,
        userId: ctx.user.id,
      })
    }),
})
```

#### LLM Prompt

```
Extract business logic from my-treasures/giving/index.ts into separate service files following the established service structure. Focus on recipient selection and item management procedures while maintaining all existing functionality.

IMPORTANT:
1. Before creating any new types or interfaces:
   - Check /supabase/types.ts for database types
   - Check /packages/api/src/shared/types.ts for existing shared types
   - Review existing router Zod schemas for input/output types
   - Reuse or extend existing types rather than creating duplicates

2. Service Integration Pattern:
   - Add all new services to the `createTRPCContext` function in `packages/api/src/trpc.ts`
   - Use the existing service injection pattern under `ctx.service.{serviceName}`
   - Follow the conditional instantiation pattern for services requiring authentication
   - Update router procedures to access services via context instead of direct instantiation

3. Target services:
   - RecipientService: recipient selection logic
   - ItemService: item management operations
   - ConfirmationService: pickup confirmations
   - WorkflowService: giving workflow orchestration

Reference the existing service injection pattern in trpc.ts for consistency.
```

#### Success Criteria

- Router complexity significantly reduced
- Clear workflow separation
- Improved error handling
- Services follow established patterns from Phase 2

---

### Phase 4: Extract User/Profile Services

**Estimated Time**: 3-4 hours  
**Priority**: Medium  
**Status**: Pending

#### Objectives

- Break down `me.ts` (1,432 lines)
- Separate profile, gift, and item management concerns
- Create user-centric service layer

#### Tasks

- [ ] Create `/packages/api/src/services/user/` directory
- [ ] Extract profile management procedures
- [ ] Extract user-specific gift operations
- [ ] Extract item selection/preference logic
- [ ] Create user data aggregation services
- [ ] Update router with service integration

#### Target Services

```
/services/user/
├── profile.service.ts       # Profile management
├── gifts.service.ts         # User gift operations
├── preferences.service.ts   # Item preferences
├── aggregation.service.ts   # User data aggregation
└── types.ts                # Service interfaces
```

#### LLM Prompt

```
Extract business logic from me.ts into separate service files. Focus on profile management and user-specific gift operations.
```

#### Success Criteria

- Clear user domain boundaries
- Reusable profile operations
- Simplified router procedures
- Consistent service patterns

---

### Phase 5: Simple Repository Pattern (Optional)

**Estimated Time**: 3-5 hours  
**Priority**: Low  
**Status**: Pending

#### Objectives

- Abstract only the most complex/repeated database operations
- Keep it simple - no full repository pattern needed
- Focus on testability for complex queries

#### Tasks

- [ ] Identify the 5-10 most complex/repeated queries
- [ ] Create simple query helpers in service files
- [ ] Only create repositories if services become too large
- [ ] Keep direct Supabase queries for simple operations

#### Example Approach

```typescript
// In gift.service.ts - simple helper functions
async function findGiftsWithInterests(supabase: SupabaseClient, giftId: string) {
  // Complex query logic extracted
}

// Only if needed:
// /repositories/gift-queries.ts - for truly complex queries
```

#### LLM Prompt

```
Identify the most complex and repeated database queries. Create simple helper functions for these queries within the service files. Only create separate repository files if absolutely necessary.
```

#### Success Criteria

- Complex queries are extracted and reusable
- Simple queries remain inline for clarity
- No over-abstraction
- Improved testability for complex operations

---

### Phase 6: Split Remaining Large Files

**Estimated Time**: 2-3 hours  
**Priority**: Medium  
**Status**: Pending

#### Objectives

- Apply established patterns to remaining large files
- Complete the modularization effort
- Ensure consistent architecture across all routes

#### Tasks

- [ ] Split `chooseARecipient.ts` (593 lines) by recipient selection domains
- [ ] Split `notifications.ts` (551 lines) by notification types
- [ ] Split `account.ts` (495 lines) by account operation categories
- [ ] Apply service extraction patterns from previous phases
- [ ] Ensure all large files follow new architecture

#### Target Structure

```
/routers/
├── choose-recipient/        # Recipient selection routes
├── notifications/           # Notification type routes
├── account/                # Account operation routes
└── [other-domains]/        # Additional domain splits
```

#### LLM Prompt

```
Split the remaining large router files using the patterns established in previous phases. Focus on domain-based separation and extracting business logic to services.
```

#### Success Criteria

- No router files exceed 300 lines
- All files follow established service patterns
- Consistent error handling and validation
- Complete architectural alignment

---

### Phase 7: Fix Timezone Handling

**Estimated Time**: 3-4 hours  
**Priority**: High  
**Status**: Pending

#### Problem Statement

The application currently has inconsistent timezone handling:

- `chooseARecipient.ts` hardcodes EST timezone (`America/New_York`)
- Client uses user's local timezone
- Server operates in UTC
- This creates confusion when users in different timezones interact with scheduling

#### Objectives

- Remove hardcoded timezone assumptions
- Standardize timezone handling across client and server
- Ensure consistent time display and comparison
- Maintain backwards compatibility with existing data

#### Tasks

- [ ] Remove hardcoded `EST_TIMEZONE` from `chooseARecipient.ts`
- [ ] Update timezone comparison logic to use UTC internally
- [ ] Ensure client displays times in user's local timezone
- [ ] Fix server-side time formatting in notifications
- [ ] Add timezone context to time displays where ambiguous
- [ ] Update any email templates that show times

#### Implementation Strategy

```typescript
// Before (BAD):
const EST_TIMEZONE = "America/New_York";
const nowEst = toZonedTime(nowUtc, EST_TIMEZONE);

// After (GOOD):
// Option 1: Use UTC for all comparisons
const startTimeUTC = new Date(rule.dtstart);
const nowUTC = new Date();
return startTimeUTC > nowUTC;

// Option 2: Use user's local timezone (if needed)
// Let the client handle timezone conversion
```

#### Client-Side Updates

```typescript
// Use date-fns for consistent formatting
import { format } from "date-fns";

// Display in user's local timezone automatically
format(pickupTime, "EEEE, MMMM d at h:mm a");
// Output: "Monday, January 20 at 3:00 PM" (in user's timezone)
```

#### Server-Side Updates

```typescript
// For emails/notifications, be explicit about timezone
const formattedTime = format(utcDate, "PPpp") + " (your local time)";
// Or if you must use a specific timezone:
const estTime = formatInTimeZone(utcDate, "America/New_York", "PPpp") + " EST";
```

#### LLM Prompt

```
Fix timezone handling by removing the hardcoded EST timezone from chooseARecipient.ts and ensuring all time comparisons use UTC internally. Update the client to display times in the user's local timezone using date-fns. Ensure server-side notifications clearly indicate timezone context.
```

#### Success Criteria

- No hardcoded timezone assumptions in business logic
- All internal time comparisons use UTC
- Client displays show user's local time
- Server communications include clear timezone context
- Existing scheduled pickups continue to work correctly
- Cross-timezone scenarios handled properly

## Implementation Guidelines

### Code Organization Principles

1. **Single Responsibility**: Each service handles one domain
2. **Service Injection via tRPC Context**: All services are instantiated once in `createTRPCContext` and passed through the context to keep things DRY
3. **Simple Dependency Passing**: Services receive Supabase client and other dependencies as parameters
4. **Minimal Abstractions**: Only create interfaces when needed for testing
5. **Consistent Error Handling**: Use the shared error utilities

#### Service Injection Pattern

All services should be instantiated in the tRPC context (`packages/api/src/trpc.ts`) to ensure:

- Single point of service instantiation
- Consistent dependency injection (authenticated Supabase client, userId, etc.)
- Availability across all tRPC procedures without re-instantiation
- Conditional service instantiation based on authentication state

```typescript
// In createTRPCContext function
export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
  // ... authentication logic ...

  return {
    supabase,
    serviceRoleSupabase: supabaseAdmin,
    user: { id: userId },

    // Service injection - instantiate all services here
    service: {
      // Moderation services (require userId)
      ...(userId
        ? {
            blocking: new BlockingService({ supabase, userId }),
            hiding: new HidingService({ supabase, userId }),
          }
        : {}),

      // Feed services (userId optional for public access)
      landmark: new LandmarkService({ supabase, userId }),
      gift: new GiftService({ supabase, userId }),
      item: new ItemService({ supabase, userId }),
      interest: new InterestService({ supabase, userId }),

      // Receiving services
      addressResolution: new AddressResolutionService(supabase),
      pickupManagement: new PickupManagementService(supabase),
      interestManagement: new InterestManagementService(supabase),
      pickupScheduling: new PickupSchedulingService(supabase),
      ...(userId
        ? {
            itemSelection: new ItemSelectionService({ supabase, user: { id: userId } }),
          }
        : {}),
    },
  };
};
```

#### Using Services in Router Procedures

```typescript
// In router procedures, access services through context
export const receivingRouter = createTRPCRouter({
  schedulePickup: protectedProcedure
    .input(schedulePickupSchema)
    .mutation(async ({ ctx, input }) => {
      // Use services from context - no need to instantiate
      const address = await ctx.service.addressResolution.resolvePickupAddress(
        input.pickupGroupId,
        input.giftId,
        ctx.user.id
      );

      return ctx.service.pickupScheduling.schedulePickup({
        ...input,
        address,
        userId: ctx.user.id,
      });
    }),
});
```

### What to Avoid

- **Over-abstraction**: Don't create repositories for simple queries
- **Event Sourcing**: Use simple event emitter, not full event store
- **Complex Patterns**: No need for aggregates, value objects, or DDD
- **Premature Optimization**: Keep direct Supabase queries when they're simple

### File Naming Conventions

- Services: `[domain].service.ts`
- Repositories: `[domain].repository.ts`
- Types: `types.ts` in each directory
- Schemas: `schemas.ts` for validation

### Testing Strategy

- Unit tests for all extracted services
- Integration tests for repository operations
- Router tests focus on request/response contracts
- Mock repositories and external dependencies

### Migration Strategy

1. Each phase is independent and can be completed separately
2. Maintain API backward compatibility throughout
3. Update tests alongside refactoring
4. Deploy incrementally to catch regressions early

## Success Metrics

### Quantitative Goals

- Reduce average router file size from 500+ to <300 lines
- Achieve >80% test coverage on extracted services
- Reduce code duplication by extracting shared utilities
- Improve build times through better module separation

### Qualitative Goals

- Improved developer onboarding experience
- Easier feature development and debugging
- Better separation of concerns
- Enhanced maintainability and readability

## Risk Mitigation

### Potential Issues

- **API Breaking Changes**: Maintain strict API contracts during refactoring
- **Performance Regression**: Monitor response times during service extraction
- **Test Coverage**: Ensure comprehensive testing of extracted logic
- **Team Coordination**: Clear communication about refactoring progress

### Mitigation Strategies

- Incremental deployment with rollback capability
- Comprehensive integration testing
- Code review requirements for all service extractions
- Documentation updates alongside code changes

## Getting Started

To begin the refactor:

1. **Review Current Architecture**: Familiarize yourself with existing patterns in `/middleware/notification/`
2. **Start with Phase 1**: Create foundation utilities before extracting services
3. **Use Existing Patterns**: Follow the notification middleware structure as a template
4. **Test Thoroughly**: Each phase should include comprehensive testing
5. **Document Changes**: Update relevant documentation as you progress

Each phase provides immediate value and can be tackled by different team members or LLM sessions simultaneously.

v10 trpc v4 tanstack query supabase zod

Additionally there's more context here for how the app progressed into services and also this touched a lot of native stuff as well that were all kind of caked in to start.
