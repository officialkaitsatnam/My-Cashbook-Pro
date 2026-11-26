# My Cashbook Pro — Private Google Login

This update adds Google Identity Services sign-in for the single owner account `kaitsatnam@gmail.com`.

## Important
- The existing Cashbook interface and spreadsheet tabs/columns are not intentionally changed by this update.
- The OAuth Client ID is public and is configured in `index.html` and `Code.gs`.
- Never publish or share an OAuth Client Secret. This browser-based Google Identity Services flow does not require a client secret.
- The Apps Script bridge verifies Google's ID token server-side, checks the token audience against the configured Client ID, and permits only the owner email.
- The old username/password registration actions are no longer reachable through the JSONP bridge without a valid owner Google ID token.

## Deployment steps
1. In Google Cloud Console, open OAuth Client `My Cashbook Pro Web`.
2. Under **Authorized JavaScript origins**, ensure `https://officialkaitsatnam.github.io` is listed exactly. For local preview, add a separate localhost origin only if needed.
3. This popup-based Google Identity Services integration does not require an Authorized redirect URI. Leave that list empty unless a future flow explicitly uses redirects.
4. In the Apps Script project attached to the existing spreadsheet, update the server code using the modified `Code.gs`. Preserve the existing spreadsheet ID and all other existing project files/functions.
5. Save the Apps Script project. When prompted, authorize the `UrlFetchApp` permission required to verify Google ID tokens.
6. Deploy > Manage deployments > Edit the existing Web App deployment > select **New version**. Keep the existing deployment access settings that allow the GitHub Pages app to call the endpoint. Do not create a second deployment unless required.
7. Push the updated `index.html` (and `icon.png`) to the existing GitHub repository. Keep the same GitHub Pages URL.
8. Open the site in a private/incognito window and test with `kaitsatnam@gmail.com`. A different Google account must be rejected.

## Security notes
- Do not rely on the visual login overlay alone: the Apps Script bridge also verifies the ID token on every data action.
- Google ID tokens expire; sign in again when the session expires.
- Keep the Apps Script deployment URL private where practical, but the server-side owner check is the actual access control.
- Test the login and read/write operations before using this version for important transactions.
