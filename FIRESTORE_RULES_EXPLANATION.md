# Firestore Security Rules Explanation

## Overview
These security rules ensure that:
1. Only authenticated users can access the database
2. Users can only access their own user document
3. Authenticated users can access other collections (like projects) with proper ownership checks

## Rule Breakdown

### Rules Version
```javascript
rules_version = '2';
```
- Uses Firestore Rules version 2 (latest version)
- Required at the top of all rules files

### Helper Functions

#### `isAuthenticated()`
```javascript
function isAuthenticated() {
  return request.auth != null;
}
```
- **Purpose**: Checks if a user is logged in
- **Returns**: `true` if `request.auth` exists (user is authenticated), `false` otherwise
- **Usage**: Base check for all operations

#### `isOwner(userId)`
```javascript
function isOwner(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}
```
- **Purpose**: Checks if the authenticated user owns the document
- **Returns**: `true` if user is authenticated AND their UID matches the document's userId
- **Usage**: Ensures users can only access their own data

---

## Users Collection Rules

### Path: `/users/{userId}`

#### Read Rule
```javascript
allow read: if isOwner(userId);
```
- **What it does**: Allows reading a user document
- **Who can access**: Only the user whose UID matches the document ID
- **Security**: Prevents users from reading other users' profiles

#### Create Rule
```javascript
allow create: if isAuthenticated() && request.auth.uid == userId;
```
- **What it does**: Allows creating a new user document
- **Who can access**: Authenticated users, but only if they're creating their own document (uid must match document ID)
- **Security**: Prevents users from creating documents for other users

#### Update Rule
```javascript
allow update: if isOwner(userId);
```
- **What it does**: Allows updating a user document
- **Who can access**: Only the document owner
- **Security**: Users can only modify their own profile

#### Delete Rule
```javascript
allow delete: if isOwner(userId);
```
- **What it does**: Allows deleting a user document
- **Who can access**: Only the document owner
- **Security**: Users can only delete their own account data

---

## Projects Collection Rules

### Path: `/projects/{projectId}`

#### Read Rule
```javascript
allow read: if isAuthenticated() && request.auth.uid == resource.data.userId;
```
- **What it does**: Allows reading a project document
- **Who can access**: Authenticated users who own the project (userId in document matches auth.uid)
- **Security**: Users can only see their own projects

#### Create Rule
```javascript
allow create: if isAuthenticated() && request.auth.uid == request.resource.data.userId;
```
- **What it does**: Allows creating a new project
- **Who can access**: Authenticated users, but the `userId` field in the new document must match their auth.uid
- **Security**: Prevents users from creating projects for other users

#### Update Rule
```javascript
allow update: if isAuthenticated() && request.auth.uid == resource.data.userId;
```
- **What it does**: Allows updating a project
- **Who can access**: Authenticated users who own the project
- **Security**: Users can only modify their own projects

#### Delete Rule
```javascript
allow delete: if isAuthenticated() && request.auth.uid == resource.data.userId;
```
- **What it does**: Allows deleting a project
- **Who can access**: Authenticated users who own the project
- **Security**: Users can only delete their own projects

---

## Default Behavior

### Implicit Deny
- Any collection or path not explicitly defined in the rules is **denied by default**
- This follows the principle of "deny by default, allow explicitly"
- Ensures maximum security

---

## Security Best Practices Applied

✅ **Authentication Required**: All operations require `request.auth != null`

✅ **Ownership Verification**: Users can only access documents they own

✅ **Document ID Validation**: Users can only create documents with their own UID as the document ID

✅ **Field Validation**: Create operations verify that `userId` field matches the authenticated user

✅ **Default Deny**: Undefined collections/paths are automatically denied

✅ **Helper Functions**: Reusable functions reduce code duplication and improve maintainability

---

## How to Deploy These Rules

### Option 1: Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy and paste the rules from `firestore.rules`
5. Click **Publish**

### Option 2: Firebase CLI
```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

---

## Testing Your Rules

### Test Scenarios

1. **User can read their own document**: ✅ Should work
2. **User cannot read another user's document**: ❌ Should be denied
3. **User can create their own user document**: ✅ Should work
4. **User cannot create a document for another user**: ❌ Should be denied
5. **User can read their own projects**: ✅ Should work
6. **User cannot read another user's projects**: ❌ Should be denied
7. **Unauthenticated user cannot access anything**: ❌ Should be denied

---

## Common Issues & Solutions

### Issue: "Missing or insufficient permissions"
- **Cause**: User is not authenticated or doesn't own the document
- **Solution**: Ensure user is logged in and accessing their own data

### Issue: "The query requires an index"
- **Cause**: Firestore query needs a composite index
- **Solution**: Click the link in the error to create the index automatically

### Issue: "Permission denied" on create
- **Cause**: `userId` field doesn't match `request.auth.uid`
- **Solution**: Ensure your code sets `userId: user.uid` when creating documents

---

## Notes

- These rules are **production-ready** but can be customized based on your needs
- For additional collections, add similar match blocks following the same pattern
- Consider adding more granular rules if you need features like:
  - Admin roles
  - Shared projects
  - Public read access
  - Field-level permissions

