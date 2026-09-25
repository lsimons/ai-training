# How a page calls the billing API

A page calls the generated client through `useApi()`, so it gets the loading
and error states the rest of the site uses:

```
const { data, error, loading } = useApi(() => invoicesApi.listInvoices());
if (loading) return <Spinner />;
if (error) return <ApiError error={error} />;
```

`src/pages/InvoiceList.tsx` is a complete page that does this.
