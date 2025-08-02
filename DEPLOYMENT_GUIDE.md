# Rental Management App - Render Deployment Guide

This guide will help you deploy your rental management application to Render.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **MongoDB Database**: You'll need a MongoDB database (MongoDB Atlas recommended)
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, etc.)

## Deployment Options

### Option 1: Separate Backend and Frontend (Recommended)

This approach deploys your backend and frontend as separate services, providing better scalability and easier maintenance.

#### Step 1: Deploy Backend

1. **Connect your repository to Render**:
   - Go to your Render dashboard
   - Click "New +" → "Web Service"
   - Connect your Git repository
   - Select the repository containing your rental management app

2. **Configure the backend service**:
   - **Name**: `rental-management-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or choose paid plan for better performance)

3. **Set Environment Variables**:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A strong secret key for JWT tokens
   - `FRONTEND_URL`: Your frontend URL (will be set after frontend deployment)
   - `PORT`: `10000` (Render will override this)

4. **Deploy**: Click "Create Web Service"

#### Step 2: Deploy Frontend

1. **Create a new static site**:
   - Go to your Render dashboard
   - Click "New +" → "Static Site"
   - Connect the same Git repository

2. **Configure the frontend service**:
   - **Name**: `rental-management-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: Leave empty (static files)
   - **Publish Directory**: `.` (current directory)

3. **Deploy**: Click "Create Static Site"

#### Step 3: Update Frontend Configuration

After both services are deployed, you'll need to update your frontend to use the backend URL:

1. **Get your backend URL**: It will be something like `https://rental-management-backend.onrender.com`

2. **Update frontend JavaScript files**: Replace all localhost URLs with your backend URL

### Option 2: Single Service Deployment

If you prefer to deploy everything as one service, you can modify your backend to serve the frontend files.

#### Step 1: Modify Backend

Add this to your `server.js` before the routes:

```javascript
// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});
```

#### Step 2: Deploy as Single Service

1. Create a new Web Service in Render
2. Set root directory to the project root (not backend)
3. Build Command: `cd backend && npm install`
4. Start Command: `cd backend && npm start`

## Environment Variables Setup

### Required Environment Variables

1. **MONGODB_URI**: Your MongoDB connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/database`
   - Get this from MongoDB Atlas or your MongoDB provider

2. **JWT_SECRET**: A strong secret key for JWT authentication
   - Generate a strong random string
   - Example: `my-super-secret-jwt-key-2024`

3. **NODE_ENV**: Set to `production`

4. **FRONTEND_URL**: Your frontend URL (for CORS)
   - Format: `https://your-frontend-app.onrender.com`

### Setting Environment Variables in Render

1. Go to your service dashboard
2. Click on "Environment" tab
3. Add each variable with its value
4. Click "Save Changes"
5. Redeploy your service

## Database Setup

### MongoDB Atlas (Recommended)

1. **Create MongoDB Atlas account**: [mongodb.com/atlas](https://mongodb.com/atlas)
2. **Create a new cluster** (free tier available)
3. **Create a database user** with read/write permissions
4. **Get connection string** and add it to your environment variables
5. **Whitelist IP addresses**: Add `0.0.0.0/0` to allow all IPs (or specific Render IPs)

### Local MongoDB (Not recommended for production)

If you must use local MongoDB, ensure it's accessible from Render's servers.

## Post-Deployment Steps

### 1. Test Your Application

1. **Test API endpoints**: Use tools like Postman or curl
2. **Test frontend functionality**: Navigate through your app
3. **Test file uploads**: Ensure uploads work correctly
4. **Test real-time features**: Test Socket.IO functionality

### 2. Update CORS Settings

Make sure your backend CORS settings include your frontend URL:

```javascript
origin: process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5500', ...]
```

### 3. Monitor Your Application

1. **Check logs**: Monitor application logs in Render dashboard
2. **Set up monitoring**: Consider using Render's built-in monitoring
3. **Set up alerts**: Configure alerts for downtime

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check if all dependencies are in `package.json`
   - Ensure Node.js version is compatible
   - Check build logs for specific errors

2. **Database Connection Issues**:
   - Verify MongoDB URI is correct
   - Check if IP whitelist includes Render's IPs
   - Ensure database user has correct permissions

3. **CORS Errors**:
   - Verify frontend URL is correctly set in environment variables
   - Check CORS configuration in server.js
   - Ensure HTTPS is used for production

4. **File Upload Issues**:
   - Check if uploads directory exists
   - Verify file size limits
   - Check file type restrictions

### Getting Help

1. **Render Documentation**: [render.com/docs](https://render.com/docs)
2. **Render Community**: [community.render.com](https://community.render.com)
3. **Check logs**: Always check application logs first

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to Git
2. **HTTPS**: Render provides HTTPS by default
3. **CORS**: Restrict CORS origins to your frontend domain
4. **JWT Secret**: Use a strong, unique JWT secret
5. **Database Security**: Use strong passwords and restrict access

## Cost Optimization

1. **Free Tier**: Start with free tier for testing
2. **Auto-sleep**: Free tier services sleep after inactivity
3. **Upgrade when needed**: Upgrade to paid plans for better performance
4. **Monitor usage**: Keep track of resource usage

## Next Steps

After successful deployment:

1. **Set up custom domain** (optional)
2. **Configure SSL certificates** (handled by Render)
3. **Set up CI/CD** for automatic deployments
4. **Implement monitoring and logging**
5. **Set up backup strategies**

Your rental management application should now be live on Render! 🚀 