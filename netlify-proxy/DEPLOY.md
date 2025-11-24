# Manual Redeploy Checklist

If Netlify does not automatically prompt for a redeploy after changing
environment variables, trigger one manually:

1. Open your site on Netlify.
2. In the left sidebar, click **Deploys**.
3. Click the button in the top-right labeled **Trigger deploy**.
4. Choose **Deploy site**. A new deploy will start and pick up the updated
   environment variables.
5. Wait until the deploy status says **Published**.
6. Reload the Chrome extension so it uses the updated proxy.

