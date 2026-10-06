import { DialogContent, Grid2, MenuItem, TextField } from "@mui/material";
import { useSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { sendTranslate } from "../../../api/api.ts";
import { setTranslateDialog } from "../../../redux/globalStateSlice.ts";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks.ts";
import { getFileLinkedUri } from "../../../util";
import { FileDisplayForm } from "../../Common/Form/FileDisplayForm.tsx";
import { ViewTaskAction } from "../../Common/Snackbar/snackbar.tsx";
import DraggableDialog from "../../Dialogs/DraggableDialog.tsx";

// Códigos aceitos pelo Transynex (apps/frontend/src/lib/labels.ts)
const languages = ["ja", "en", "pt-BR", "pt-PT", "es", "zh", "ko", "fr", "de", "it", "ru", "ar", "nl", "pl", "tr"];
const LANGS_KEY = "transynex_langs";

const loadLangs = (): { from: string; to: string } => {
  try {
    return { from: "en", to: "pt-BR", ...JSON.parse(localStorage.getItem(LANGS_KEY) ?? "{}") };
  } catch {
    return { from: "en", to: "pt-BR" };
  }
};

const TranslateFile = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(() => loadLangs().from);
  const [to, setTo] = useState(() => loadLangs().to);

  const open = useAppSelector((state) => state.globalState.translateDialogOpen);
  const target = useAppSelector((state) => state.globalState.translateDialogFile);

  const languageName = useMemo(() => {
    const names = new Intl.DisplayNames([i18n.language], { type: "language" });
    return (code: string) => `${names.of(code) ?? code} (${code})`;
  }, [i18n.language]);

  const onClose = useCallback(() => {
    dispatch(setTranslateDialog({ open: false, file: target }));
  }, [dispatch, target]);

  const onAccept = useCallback(() => {
    if (!target) {
      return;
    }

    try {
      localStorage.setItem(LANGS_KEY, JSON.stringify({ from, to }));
    } catch {
      /* storage indisponível: só não lembra */
    }
    setLoading(true);
    dispatch(sendTranslate({ src: getFileLinkedUri(target), source_language: from, target_language: to }))
      .then(() => {
        onClose();
        enqueueSnackbar({
          message: t("modals.taskCreated"),
          variant: "success",
          action: ViewTaskAction(),
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [target, from, to, onClose]);

  const languageSelect = (label: string, value: string, onChange: (v: string) => void) => (
    <TextField select fullWidth label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      {languages.map((code) => (
        <MenuItem key={code} value={code}>
          {languageName(code)}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <DraggableDialog
      title={t("application:fileManager.translate")}
      showActions
      loading={loading}
      showCancel
      onAccept={onAccept}
      dialogProps={{
        open: open ?? false,
        onClose: onClose,
        fullWidth: true,
        maxWidth: "sm",
        disableRestoreFocus: true,
      }}
    >
      <DialogContent sx={{ pt: 1 }}>
        <Grid2 container spacing={3}>
          {target && (
            <Grid2 size={{ xs: 12 }}>
              <FileDisplayForm file={target} label={t("application:modals.translateFile")} />
            </Grid2>
          )}
          <Grid2 size={{ xs: 12, md: 6 }}>{languageSelect(t("application:modals.translateFrom"), from, setFrom)}</Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>{languageSelect(t("application:modals.translateTo"), to, setTo)}</Grid2>
        </Grid2>
      </DialogContent>
    </DraggableDialog>
  );
};
export default TranslateFile;
