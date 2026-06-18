# Auth Testing Playbook (Emergent Google Auth)

## Quick test session creation
```bash
mongosh "$MONGO_URL" --eval "
use('test_database');
const userId = 'user_test_' + Date.now();
const sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'aielenterprises3321@gmail.com',
  name: 'Aiel Admin',
  picture: 'https://placehold.co/120',
  is_admin: true,
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print(sessionToken);
"
```

## Backend tests
```
curl "$BACKEND/api/auth/me" -H "Authorization: Bearer $TOKEN"
curl "$BACKEND/api/admin/orders" -H "Authorization: Bearer $TOKEN"
```

## Browser test
```python
await page.context.add_cookies([{
  "name": "session_token", "value": TOKEN,
  "domain": HOST, "path": "/", "httpOnly": True, "secure": True, "sameSite": "None"
}])
await page.goto(f"https://{HOST}/admin")
```

## Cleanup
```bash
mongosh "$MONGO_URL" --eval "
use('test_database');
db.users.deleteMany({email:/test/});
db.user_sessions.deleteMany({session_token:/test_session/});
"
```
