# 👥 Team-Based Messaging System

## 🔒 **Security & Access Control**

The conversations system now implements team-based messaging restrictions to ensure users can only communicate with appropriate team members and administrators.

## 🎯 **Who Can Message Whom**

### **Administrators (Admin Role):**
- ✅ Can message **anyone** in the system
- ✅ Can be messaged by **anyone** in the system
- ✅ Have full messaging privileges
- ✅ Can create conversations with any users

### **Managers & Members:**
- ✅ Can message **team members** (users in the same teams)
- ✅ Can message **administrators** 
- ❌ **Cannot** message users outside their teams
- ❌ **Cannot** message users who aren't in any shared teams

### **Team Members:**
- ✅ Can message other members of the **same team(s)**
- ✅ Can message **administrators**
- ❌ **Cannot** message users from different teams
- ❌ **Cannot** message users not in any teams

## 🔧 **How It Works**

### **User Search Restrictions:**
When searching for users to start conversations:

1. **Admin users** see all users in search results
2. **Non-admin users** only see:
   - Users from their teams
   - All administrators
   - Users with role badges (Admin/Manager) displayed

### **Conversation Creation Validation:**
When creating conversations:

1. **System validates** all participants are allowed
2. **Blocks creation** if trying to add unauthorized users
3. **Shows error message**: "You can only message team members and administrators"

### **Real-Time Security:**
- All messaging restrictions apply to real-time features
- Sound notifications only for authorized conversations
- Sidebar badges only show counts for valid conversations

## 🧪 **Testing Team-Based Messaging**

### **Setup Test Scenario:**

1. **Create test users with different roles:**
   ```
   User A: Admin role
   User B: Manager role, Team 1
   User C: Member role, Team 1  
   User D: Member role, Team 2
   User E: Member role, no teams
   ```

2. **Expected messaging permissions:**
   ```
   User A (Admin): Can message B, C, D, E
   User B (Team 1): Can message A, C (same team)
   User C (Team 1): Can message A, B (same team)
   User D (Team 2): Can message A only
   User E (No teams): Can message A only
   ```

### **Test Cases:**

#### **✅ Should Work:**
- Admin messaging anyone
- Team members messaging each other
- Anyone messaging admins
- Group chats with valid team members

#### **❌ Should Be Blocked:**
- Team 1 member messaging Team 2 member
- User with no teams messaging regular members
- Creating conversations with unauthorized users

## 🎨 **UI Indicators**

### **User Search Results:**
- **Admin badge**: Blue "Admin" label
- **Manager badge**: Green "Manager" label  
- **Role visibility**: Shows user roles in search
- **Filtered results**: Only shows messageable users

### **Error Messages:**
- Clear feedback when trying to message unauthorized users
- Helpful explanations about team-based restrictions
- Guidance on who can be messaged

## 🔍 **Database Structure**

### **Key Tables:**
- `team_members`: Links users to teams
- `profiles`: Stores user roles (admin, manager, member)
- `conversations`: Stores conversation metadata
- `conversation_participants`: Links users to conversations

### **Security Validation:**
```sql
-- Example: Check if User A can message User B
SELECT EXISTS (
  -- Same team
  SELECT 1 FROM team_members tm1 
  JOIN team_members tm2 ON tm1.team_id = tm2.team_id
  WHERE tm1.user_id = 'user_a' AND tm2.user_id = 'user_b'
  
  UNION
  
  -- User B is admin
  SELECT 1 FROM profiles 
  WHERE id = 'user_b' AND role = 'admin'
  
  UNION
  
  -- User A is admin
  SELECT 1 FROM profiles 
  WHERE id = 'user_a' AND role = 'admin'
)
```

## 🚀 **Implementation Benefits**

### **Security:**
- ✅ Prevents unauthorized communication
- ✅ Maintains team boundaries
- ✅ Protects sensitive information
- ✅ Complies with organizational structure

### **User Experience:**
- ✅ Clear role indicators
- ✅ Intuitive search filtering
- ✅ Helpful error messages
- ✅ Seamless for authorized users

### **Administration:**
- ✅ Admins have full access
- ✅ Easy team management
- ✅ Role-based permissions
- ✅ Scalable security model

## 🎯 **Best Practices**

### **For Administrators:**
- Assign users to appropriate teams
- Use admin role sparingly for security
- Monitor team structures regularly
- Test messaging permissions after team changes

### **For Users:**
- Understand your team memberships
- Contact admins for cross-team communication needs
- Use group chats for team collaboration
- Report any messaging issues to administrators

---

**The team-based messaging system ensures secure, organized communication while maintaining flexibility for administrators and clear boundaries for team members.**