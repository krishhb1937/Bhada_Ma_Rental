# Deployment Checklist

## Pre-Deployment

- [ ] **Git Repository**: Code is pushed to Git repository (GitHub/GitLab)
- [ ] **MongoDB Setup**: MongoDB Atlas account created and cluster configured
- [ ] **Environment Variables**: All sensitive data removed from code
- [ ] **Dependencies**: All dependencies listed in `package.json`
- [ ] **CORS Configuration**: Backend CORS settings updated for production

## Backend Deployment

- [ ] **Create Web Service** on Render
- [ ] **Connect Repository** to Render
- [ ] **Set Root Directory** to `backend`
- [ ] **Configure Build Command**: `npm install`
- [ ] **Configure Start Command**: `npm start`
- [ ] **Set Environment Variables**:
  - [ ] `NODE_ENV` = `production`
  - [ ] `MONGODB_URI` = Your MongoDB connection string
  - [ ] `JWT_SECRET` = Strong secret key
  - [ ] `FRONTEND_URL` = (will set after frontend deployment)
- [ ] **Deploy Backend**
- [ ] **Test Backend API** endpoints
- [ ] **Note Backend URL** for frontend configuration

## Frontend Deployment

- [ ] **Create Static Site** on Render
- [ ] **Connect Repository** to Render
- [ ] **Set Root Directory** to `frontend`
- [ ] **Leave Build Command** empty
- [ ] **Set Publish Directory** to `.`
- [ ] **Deploy Frontend**
- [ ] **Update Frontend URLs** using the script:
  ```bash
  node update-frontend-urls.js https://your-backend-url.onrender.com
  ```
- [ ] **Redeploy Frontend** with updated URLs

## Post-Deployment

- [ ] **Update Backend Environment Variables**:
  - [ ] Set `FRONTEND_URL` to your frontend URL
- [ ] **Redeploy Backend** with updated environment variables
- [ ] **Test Complete Application**:
  - [ ] User registration/login
  - [ ] Property listing/creation
  - [ ] Booking functionality
  - [ ] Messaging system
  - [ ] File uploads
  - [ ] Real-time features (Socket.IO)
- [ ] **Monitor Logs** for any errors
- [ ] **Test on Different Devices/Browsers**

## Security Verification

- [ ] **HTTPS**: Verify HTTPS is working
- [ ] **CORS**: Test CORS restrictions
- [ ] **Environment Variables**: Confirm no secrets in code
- [ ] **Database Security**: Verify MongoDB access restrictions
- [ ] **File Uploads**: Test upload security

## Performance Check

- [ ] **Page Load Times**: Test frontend performance
- [ ] **API Response Times**: Test backend performance
- [ ] **Database Queries**: Monitor query performance
- [ ] **File Uploads**: Test upload speeds

## Final Steps

- [ ] **Document URLs**: Save both frontend and backend URLs
- [ ] **Set up Monitoring**: Configure alerts if needed
- [ ] **Backup Strategy**: Plan for data backups
- [ ] **Domain Setup**: Configure custom domain (optional)
- [ ] **SSL Verification**: Confirm SSL certificates are working

## Troubleshooting

If deployment fails:

1. **Check Build Logs**: Look for specific error messages
2. **Verify Dependencies**: Ensure all packages are in `package.json`
3. **Test Locally**: Run `npm start` locally to catch issues
4. **Check Environment Variables**: Verify all required variables are set
5. **Database Connection**: Test MongoDB connection string
6. **CORS Issues**: Check CORS configuration
7. **File Permissions**: Ensure uploads directory exists

## Success Indicators

✅ Backend API responds correctly  
✅ Frontend loads without errors  
✅ User authentication works  
✅ Database operations succeed  
✅ File uploads work  
✅ Real-time features function  
✅ No console errors in browser  
✅ All pages load properly  

---

**Your rental management app is now live! 🎉** 