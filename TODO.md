WhereTo is a development app. Before productionizing:

1. Verify domain in Resend
   - In Resend dashboard, add and verify your domain
   - Update the `from` email in `src/lib/email.ts` to use your domain

(Optional) Add custom domain for emails to .env:
# RESEND_FROM_EMAIL=noreply@yourdomain.com 

## Other Email Production Considerations

- **Domain Verification:** Always verify your sending domain for better deliverability
- **Rate Limiting:** Implement rate limiting on the forgot-password endpoint
- **Email Templates:** Consider using a template service like MJML or React Email
- **Monitoring:** Set up email delivery monitoring and bounce handling
- **Security:** Use environment variables for all sensitive credentials 
