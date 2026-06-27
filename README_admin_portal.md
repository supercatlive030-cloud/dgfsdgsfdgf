# Admin portal behavior

## What was added
- `admin_portal_redirect.js`: if a logged-in user also has `localStorage.admin === 'true'`, then the Home nav shows a new **🔧 Admin** link that goes to `admin.html`.

## How to enable admin
Open DevTools console on the same browser and run:

```js
localStorage.setItem('admin', 'true')
location.reload()
```

To disable:
```js
localStorage.setItem('admin', 'false')
location.reload()
```

