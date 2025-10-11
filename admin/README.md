## API configuration

The admin panel uses `https://euroline.1edu.kz/api` as the default backend origin.  
Override it by defining `NEXT_PUBLIC_API_URL` before running the app:

```bash
NEXT_PUBLIC_API_URL="https://staging.example.com" npm run dev
```

URLs are normalized, so both `https://host` and `https://host/api` are accepted.
