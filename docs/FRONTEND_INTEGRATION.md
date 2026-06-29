# Frontend Integration Notes

## Show Analysis PDF Button

Use this endpoint:

```http
GET /api/v1/patients/:patientId/tests/:testId/pdf
```

With Bearer token.

### Recommended fetch approach

```ts
async function openAnalysisPdf(patientId: string, testId: string, token: string) {
  const res = await fetch(`${API_URL}/patients/${patientId}/tests/${testId}/pdf`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error('Unable to open PDF');

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
```

## Upload Analysis PDF

```ts
async function uploadAnalysisPdf(patientId: string, testId: string, file: File, token: string) {
  const form = new FormData();
  form.append('pdf', file);

  const res = await fetch(`${API_URL}/patients/${patientId}/tests/${testId}/pdf`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });

  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}
```
