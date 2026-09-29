import { useEffect } from 'react';

import { useLedger } from './LedgerProvider';
import { useSnackbar } from './SnackbarProvider';

export function SaveErrorWatcher() {
  const { saveError, clearSaveError } = useLedger();
  const { show } = useSnackbar();

  useEffect(() => {
    if (saveError === null) return;
    show({ message: `${saveError} — muutos ei säily sovelluksen sulkemisen yli` });
    clearSaveError();
  }, [saveError, show, clearSaveError]);

  return null;
}
