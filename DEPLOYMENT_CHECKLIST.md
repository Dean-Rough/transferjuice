# TransferJuice Deployment Checklist

## Pre-Deployment Steps

### 1. Environment Variables in Vercel

You'll need to add these in your Vercel project settings:

```env
# Required
DATABASE_URL=         # Your Neon PostgreSQL connection string
OPENAI_API_KEY=      # For Terry AI commentary
ADMIN_API_KEY=       # For manual tweet entry (create a secure random string)
CRON_SECRET=         # For cron job authentication (create a secure random string)

# Optional but recommended
SENDGRID_API_KEY=    # For email delivery (daily summaries)
```

### 2. Database Migration

After setting up environment variables, Vercel will automatically run the build command which includes:

- `prisma generate`
- `prisma db push` (if you add it to the build script)

### 3. Git Repository

```bash
# Add all changes
git add .

# Commit
git commit -m "Clean slate rebuild - simplified TransferJuice with 4x daily briefings"

# Push to main branch
git push origin main
```

## Vercel Deployment

### 1. Import Project (if not already done)

- Go to https://vercel.com/new
- Import your GitHub repository
- Select the TransferJuice project

### 2. Configure Build Settings

- Framework Preset: Next.js
- Build Command: `npm run build` (default)
- Output Directory: `.next` (default)
- Install Command: `npm install` (default)

### 3. Environment Variables

Add all the variables from step 1 above in the Vercel dashboard:

- Go to Project Settings → Environment Variables
- Add each variable for Production environment

### 4. Deploy

- Click "Deploy"
- Wait for the build to complete

## Post-Deployment Verification

### 1. Check Application

- Visit your production URL
- Verify the homepage loads with dark theme
- Check that fonts (Geist Sans/Mono) are loading correctly

### 2. Test Manual Tweet Entry

- Navigate to `/admin`
- Use your ADMIN_API_KEY to authenticate
- Add a test tweet
- Click "Generate Briefing Now" to test immediate generation

### 3. Verify Cron Jobs

In Vercel dashboard:

- Go to Functions tab
- Check that cron jobs are registered for:
  - 9:00 AM UTC
  - 12:00 PM UTC
  - 4:00 PM UTC (16:00)
  - 8:00 PM UTC (20:00)

### 4. Monitor First Cron Run

- Wait for the next scheduled time
- Check Vercel Function logs to ensure cron executed
- Verify briefing appears on homepage

## Troubleshooting

### If cron jobs don't appear:

1. Ensure `vercel.json` is committed
2. Redeploy the project
3. Check that CRON_SECRET matches in both Vercel env vars and cron configuration

### If manual tweets fail:

1. Verify ADMIN_API_KEY is set in Vercel
2. Check browser console for errors
3. Review Vercel Function logs

### If briefings don't generate:

1. Check OPENAI_API_KEY is valid
2. Ensure database connection is working
3. Review Function logs for Terry AI errors

## Next Steps After Deployment

1. **Content Pipeline**

   - Use `/admin` page to manually add tweets throughout the day
   - Consider setting up RSS feeds as alternative sources

2. **Email Summaries**

   - Add SENDGRID_API_KEY when ready
   - Implement daily summary email functionality

3. **Monitoring**
   - Set up Vercel Analytics
   - Monitor Function execution times
   - Track briefing generation success rate

## Quick Commands

```bash
# View production logs
vercel logs

# Check deployment status
vercel

# Force redeploy
vercel --prod --force
```

## Important Notes

- The cron jobs will run at UTC times (adjust for GMT/BST accordingly)
- First briefing generation may take longer as Terry AI warms up
- Manual tweet entry is your primary content source until Twitter auth is resolved
- The database will persist between deployments

Ready to deploy! 🚀
