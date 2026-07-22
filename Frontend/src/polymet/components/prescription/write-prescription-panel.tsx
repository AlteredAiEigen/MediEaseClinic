import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Plus, Save, FileText, X, Loader2, Send, MessageCircle, AlertTriangle, Trash2 } from "lucide-react";
import { post, put, get, del } from "@/lib/api-client";
import { upsertPrescriptionCatalogItem } from "@/lib/prescription-catalog-api";
import type { PrescriptionCatalogType } from "@/lib/prescription-catalog";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PrescriptionPatientDetails } from "@/polymet/components/prescription/patient-details";
import {
  PrescriptionMedicineRow,
  type MedicineEntry,
} from "@/polymet/components/prescription/medicine-row";
import { PrescriptionFooter } from "@/polymet/components/prescription/prescription-footer";
import { PrescriptionHeader } from "@/polymet/components/prescription/prescription-header";
import {
  buildDigitalRxNotes,
  buildPrescriptionSummary,
  mapDigitalRxMedicine,
  parseNextAppointmentFromNotes,
  parsePrescribedTestsFromNotes,
  unmapMedicationToMedicineEntry,
  type SavedPrescription,
} from "@/polymet/utils/digital-prescription-save";

export interface WritePrescriptionPrefill {
  patientMongoId: string;
  patientName: string;
  patientAge?: string;
  patientGender?: string;
  patientPhone?: string;
  bp?: string;
  pulse?: string;
  spo2?: string;
  diagnosis?: string;
  prescribedTests?: string;
  nextAppointment?: string;
}

interface WritePrescriptionPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill: WritePrescriptionPrefill | null;
  doctorId: string;
  appointmentId?: string | null;
  queueId?: string | null;
  onSaved?: (data: {
    diagnosis: string;
    prescribedTests: string;
    nextAppointment: string;
    prescriptionSummary: string;
  }) => void;
  onPdfGenerated?: (data: { s3Url: string; s3Key: string; documentName?: string }) => void;
  onDeleted?: () => void;
  /** Open a specific prescription from the consultation list. */
  initialPrescriptionId?: string | null;
}

const createEmptyMedicine = (): MedicineEntry => ({
  id: crypto.randomUUID(),
  name: "",
  type: "TAB",
  composition: "",
  dosageMorning: 1,
  dosageAfternoon: 0,
  dosageNight: 0,
  timingFreqDuration: "",
  quantity: 60,
});

function formatWhatsappFailureMessage(whatsapp?: {
  reason?: string;
  error_message?: string;
} | null): string {
  const reason = (whatsapp?.reason || "").toLowerCase();
  const detail = (whatsapp?.error_message || "").trim();

  if (reason === "no_whatsapp_consent" || reason.includes("consent")) {
    return (
      "Patient has not consented to WhatsApp messages. " +
      "Please print the prescription or share it manually."
    );
  }
  if (
    reason === "invalid_phone" ||
    reason.includes("phone") ||
    detail.toLowerCase().includes("phone")
  ) {
    return (
      "Patient phone number is missing or invalid for WhatsApp. " +
      "Update the phone number, or print/share the prescription manually."
    );
  }
  if (reason === "twilio_not_configured" || reason === "config") {
    return (
      "WhatsApp messaging is not configured on the server. " +
      "The PDF was saved — please print or share the prescription manually with the patient."
    );
  }
  if (reason === "template_missing") {
    return (
      "WhatsApp prescription template is not available. " +
      "The PDF was saved — please print or share it manually."
    );
  }
  if (detail) {
    return (
      `${detail} ` +
      "The PDF may still be saved. Please print or share the prescription manually with the patient."
    );
  }
  return (
    "Could not send the prescription on WhatsApp. " +
    "Please print it or write/share it manually so the patient receives their medicines."
  );
}

export function WritePrescriptionPanel({
  open,
  onOpenChange,
  prefill,
  doctorId,
  appointmentId,
  queueId,
  onSaved,
  onPdfGenerated,
  onDeleted,
  initialPrescriptionId = null,
}: WritePrescriptionPanelProps) {
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescribedTests, setPrescribedTests] = useState("");
  const [nextAppointment, setNextAppointment] = useState("");
  const [medicines, setMedicines] = useState<MedicineEntry[]>([createEmptyMedicine()]);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingPrescription, setLoadingPrescription] = useState(false);
  const [existingPrescriptionId, setExistingPrescriptionId] = useState<string | null>(null);
  const [prescriptionOptions, setPrescriptionOptions] = useState<SavedPrescription[]>([]);
  const [selectedIsActive, setSelectedIsActive] = useState(true);
  const [language, setLanguage] = useState<"en" | "hi">("hi");
  const [sendViaWhatsapp, setSendViaWhatsapp] = useState(true);
  const [alreadySentOnWhatsapp, setAlreadySentOnWhatsapp] = useState(false);
  const [prescriptionFinalized, setPrescriptionFinalized] = useState(false);
  const [finalizedVia, setFinalizedVia] = useState<"whatsapp" | "print" | null>(null);
  const [deliveryFailedMessage, setDeliveryFailedMessage] = useState<string | null>(null);
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const [confirmNewRxOpen, setConfirmNewRxOpen] = useState(false);
  const [sendErrorOpen, setSendErrorOpen] = useState(false);
  const [sendErrorMessage, setSendErrorMessage] = useState("");
  const [startingNew, setStartingNew] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const applySavedToForm = useCallback((saved: SavedPrescription) => {
    setDiagnosis(saved.diagnosis?.trim() || "");
    if (saved.notes) {
      setPrescribedTests(parsePrescribedTestsFromNotes(saved.notes) || "");
      setNextAppointment(parseNextAppointmentFromNotes(saved.notes) || "");
    } else {
      setPrescribedTests("");
      setNextAppointment("");
    }
    if (saved.language === "hi" || saved.language === "en") {
      setLanguage(saved.language);
    }

    const restored = (saved.medications || [])
      .filter((med) => med.name?.trim())
      .map((med) => {
        const mapped = unmapMedicationToMedicineEntry(med);
        return {
          id: crypto.randomUUID(),
          ...mapped,
        };
      });

    setMedicines(restored.length > 0 ? restored : [createEmptyMedicine()]);
    setExistingPrescriptionId(saved._id);
    setSelectedIsActive(saved.isActive !== false);
  }, []);

  const resetFormToBlank = useCallback(() => {
    setDiagnosis("");
    setPrescribedTests("");
    setNextAppointment("");
    setMedicines([createEmptyMedicine()]);
    setExistingPrescriptionId(null);
    setSelectedIsActive(true);
  }, []);

  const refreshPrescriptionList = useCallback(async () => {
    if (!appointmentId) {
      setPrescriptionOptions([]);
      return [] as SavedPrescription[];
    }
    const listResponse = await get<{ prescriptions: SavedPrescription[] }>(
      `/api/prescriptions/consultation/list?appointmentId=${encodeURIComponent(appointmentId)}&includeInactive=true`,
    );
    const list = listResponse.success ? listResponse.data?.prescriptions || [] : [];
    setPrescriptionOptions(list);
    return list;
  }, [appointmentId]);

  useEffect(() => {
    if (!open || !prefill) return;

    let cancelled = false;

    const applyPrefill = () => {
      setPatientName(prefill.patientName || "");
      setPatientAge(prefill.patientAge || "");
      setPatientGender(prefill.patientGender || "");
      setPatientPhone(prefill.patientPhone || "");
      setDiagnosis(prefill.diagnosis || "");
      setPrescribedTests(prefill.prescribedTests || "");
      setNextAppointment(prefill.nextAppointment || "");
      setMedicines([createEmptyMedicine()]);
      setExistingPrescriptionId(null);
      setSelectedIsActive(true);
      setPrescriptionOptions([]);
      setSendViaWhatsapp(Boolean(prefill.patientPhone?.trim()));
      setAlreadySentOnWhatsapp(false);
      setPrescriptionFinalized(false);
      setFinalizedVia(null);
      setDeliveryFailedMessage(null);
    };

    const loadSavedPrescription = async () => {
      setLoadingPrescription(true);
      applyPrefill();

      try {
        if (!appointmentId) return;

        let sentFlag = false;
        let finalizedFlag = false;
        let via: "whatsapp" | "print" | null = null;
        const appointmentResponse = await get<{
          appointment?: {
            prescriptionWhatsappSent?: boolean;
            prescriptionFinalized?: boolean;
            prescriptionFinalizedVia?: "whatsapp" | "print" | string;
            prescriptionWhatsappDeliveryFailed?: boolean;
            prescriptionWhatsappDeliveryError?: string;
          };
        }>(`/api/appointments/${appointmentId}`);
        if (!cancelled && appointmentResponse.success) {
          const apt = appointmentResponse.data?.appointment;
          sentFlag = Boolean(apt?.prescriptionWhatsappSent);
          finalizedFlag = Boolean(apt?.prescriptionFinalized) || sentFlag;
          via =
            apt?.prescriptionFinalizedVia === "print" || apt?.prescriptionFinalizedVia === "whatsapp"
              ? apt.prescriptionFinalizedVia
              : sentFlag
                ? "whatsapp"
                : null;
          setAlreadySentOnWhatsapp(sentFlag);
          setPrescriptionFinalized(finalizedFlag);
          setFinalizedVia(via);
          if (apt?.prescriptionWhatsappDeliveryFailed && apt.prescriptionWhatsappDeliveryError) {
            setDeliveryFailedMessage(apt.prescriptionWhatsappDeliveryError);
          }
        }

        const list = await refreshPrescriptionList();
        if (cancelled) return;

        const withMeds = list.filter((p) =>
          (p.medications || []).some((m) => Boolean(m.name?.trim())),
        );

        // Explicit open from consultation list takes priority.
        if (initialPrescriptionId) {
          const selected =
            list.find((p) => p._id === initialPrescriptionId) ||
            withMeds.find((p) => p._id === initialPrescriptionId);
          if (selected) {
            applySavedToForm(selected);
            if (finalizedFlag || selected.isActive === false) {
              setPrescriptionFinalized(true);
            }
            return;
          }
        }

        // Finalized / already-sent: always reopen the completed Rx (never a blank new draft).
        if (finalizedFlag || sentFlag) {
          const toOpen =
            withMeds.find((p) => p.isActive !== false) ||
            withMeds[0] ||
            list[0];
          if (toOpen) {
            applySavedToForm(toOpen);
            setPrescriptionFinalized(true);
          } else {
            resetFormToBlank();
            setPrescriptionFinalized(true);
          }
          return;
        }

        const active = withMeds.find((p) => p.isActive !== false) || list.find((p) => p.isActive !== false);
        if (active) {
          applySavedToForm(active);
        } else {
          resetFormToBlank();
          if (!prefill.diagnosis) setDiagnosis("");
        }
      } catch (err) {
        console.warn("Failed to load saved prescription for consultation:", err);
      } finally {
        if (!cancelled) {
          setLoadingPrescription(false);
        }
      }
    };

    void loadSavedPrescription();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    prefill,
    appointmentId,
    initialPrescriptionId,
    applySavedToForm,
    refreshPrescriptionList,
    resetFormToBlank,
  ]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  const formLocked = prescriptionFinalized || alreadySentOnWhatsapp || !selectedIsActive;

  const addMedicine = () => {
    if (formLocked) {
      setConfirmNewRxOpen(true);
      return;
    }
    setMedicines((prev) => [...prev, createEmptyMedicine()]);
  };

  const removeMedicine = (id: string) => {
    if (formLocked) {
      setConfirmNewRxOpen(true);
      return;
    }
    setMedicines((prev) => prev.filter((m) => m.id !== id));
  };

  const updateMedicine = useCallback(
    (id: string, field: keyof MedicineEntry, value: string | number) => {
      if (prescriptionFinalized || alreadySentOnWhatsapp || !selectedIsActive) {
        setConfirmNewRxOpen(true);
        return;
      }
      setMedicines((prev) =>
        prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
      );
    },
    [prescriptionFinalized, alreadySentOnWhatsapp, selectedIsActive],
  );

  const selectPrescriptionById = (prescriptionId: string) => {
    const selected = prescriptionOptions.find((p) => p._id === prescriptionId);
    if (!selected) return;
    applySavedToForm(selected);
    // Viewing an inactive/archived Rx is always read-only.
    if (selected.isActive === false) {
      setAlreadySentOnWhatsapp(true);
    } else {
      // Active draft — unlock unless appointment still has WhatsApp-sent lock with no new draft path
      void get<{ appointment?: { prescriptionWhatsappSent?: boolean } }>(
        `/api/appointments/${appointmentId}`,
      ).then((appointmentResponse) => {
        const sent = Boolean(
          appointmentResponse.data?.appointment?.prescriptionWhatsappSent,
        );
        setAlreadySentOnWhatsapp(sent);
      });
    }
  };

  const persistPrescription = async () => {
    if (formLocked) {
      setConfirmNewRxOpen(true);
      return null;
    }
    if (!prefill?.patientMongoId) {
      toast({ title: "Patient not found", variant: "destructive" });
      return null;
    }
    if (!patientName.trim()) {
      toast({ title: "Patient name is required", variant: "destructive" });
      return null;
    }
    if (!appointmentId) {
      toast({
        title: "Appointment required",
        description: "Cannot save prescription without an appointment.",
        variant: "destructive",
      });
      return null;
    }

    const validMedicines = medicines.filter((m) => m.name.trim());
    if (validMedicines.length === 0) {
      toast({ title: "Add at least one medicine", variant: "destructive" });
      return null;
    }

    for (const med of validMedicines) {
      await upsertPrescriptionCatalogItem({
        name: med.name.trim(),
        type: med.type as PrescriptionCatalogType,
        composition: med.composition || undefined,
      });
    }

    if (prescribedTests.trim()) {
      for (const testName of prescribedTests.split(",").map((t) => t.trim()).filter(Boolean)) {
        await upsertPrescriptionCatalogItem({
          name: testName,
          type: "TEST",
        });
      }
    }

    const payload = {
      patientMongoId: prefill.patientMongoId,
      patientName: patientName.trim(),
      diagnosis: diagnosis.trim(),
      prescribedTests: prescribedTests.trim(),
      nextAppointment: nextAppointment.trim(),
      medicines: validMedicines,
    };

    const prescriptionSummary = buildPrescriptionSummary(validMedicines);
    const medications = validMedicines.map(mapDigitalRxMedicine);
    const notes = buildDigitalRxNotes(payload);
    const hasHindiContent = validMedicines.some((m) =>
      /[\u0900-\u097F]/.test(m.timingFreqDuration || ""),
    );
    const saveLanguage = hasHindiContent ? "hi" : language;

    // Only PUT an active existing draft. After create-new / delete, always POST a fresh row.
    const canUpdateExisting =
      Boolean(existingPrescriptionId) &&
      selectedIsActive &&
      !alreadySentOnWhatsapp &&
      !prescriptionFinalized;

    const response = canUpdateExisting
      ? await put<{ prescription: { _id?: string } }>(`/api/prescriptions/${existingPrescriptionId}`, {
          diagnosis: payload.diagnosis || "",
          medications,
          notes,
          language: saveLanguage,
        })
      : await post<{ prescription: { _id?: string } }>("/api/prescriptions", {
          patientId: prefill.patientMongoId,
          doctorId,
          appointmentId,
          queueId: queueId || undefined,
          diagnosis: payload.diagnosis || "",
          medications,
          notes,
          language: saveLanguage,
        });

    if (!response.success) {
      throw new Error(
        typeof response.message === "string" ? response.message : "Failed to save prescription",
      );
    }

    const savedId = response.data?.prescription?._id;
    if (savedId) {
      setExistingPrescriptionId(savedId);
      setSelectedIsActive(true);
    }

    try {
      await put(`/api/appointments/${appointmentId}`, {
        diagnosis: payload.diagnosis || null,
        prescribedTest: payload.prescribedTests || null,
        followUpInstructions: payload.nextAppointment || null,
        prescription: prescriptionSummary || null,
      });
    } catch (appointmentErr) {
      console.warn("Failed to sync appointment after prescription save:", appointmentErr);
    }

    if (queueId) {
      try {
        await put(`/api/queue/${queueId}/consultation`, {
          prescription: prescriptionSummary || null,
          diagnosis: payload.diagnosis || null,
          prescribedTest: payload.prescribedTests || null,
          followUpInstructions: payload.nextAppointment || null,
        });
      } catch (queueErr) {
        console.warn("Failed to sync queue consultation after prescription save:", queueErr);
      }
    }

    await refreshPrescriptionList();

    return { payload, prescriptionSummary };
  };

  const savePrescription = async () => {
    if (formLocked) {
      setConfirmNewRxOpen(true);
      return;
    }
    setSaving(true);
    try {
      const result = await persistPrescription();
      if (!result) return;

      toast({
        title: "Prescription saved",
        description: "Saved successfully. You can still edit until it is sent on WhatsApp.",
      });
      onSaved?.({
        diagnosis: result.payload.diagnosis,
        prescribedTests: result.payload.prescribedTests,
        nextAppointment: result.payload.nextAppointment,
        prescriptionSummary: result.prescriptionSummary,
      });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Failed to save prescription",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const executeSendPrescription = async () => {
    if (!appointmentId) {
      toast({
        title: "Appointment required",
        description: "An appointment is required to generate and store the prescription PDF.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const result = await persistPrescription();
      if (!result) return;

      const hasHindiContent = result.payload.medicines.some((m) =>
        /[\u0900-\u097F]/.test(m.timingFreqDuration || ""),
      );
      const pdfLanguage = hasHindiContent ? "hi" : language;

      const pdfResponse = await post<{
        s3Url: string;
        s3Key: string;
        downloadUrl?: string;
        documentName?: string;
        medicationCount?: number;
        whatsappFailed?: boolean;
        whatsapp?: {
          success?: boolean;
          skipped?: boolean;
          reason?: string;
          error_message?: string;
          downloadUrl?: string;
        };
      }>(
        `/api/appointments/${appointmentId}/generate-prescription-pdf?sendWhatsApp=${sendViaWhatsapp ? "true" : "false"}&language=${encodeURIComponent(pdfLanguage)}`,
      );

      if (!pdfResponse.success || !pdfResponse.data?.s3Url) {
        throw new Error(
          typeof pdfResponse.message === "string"
            ? pdfResponse.message
            : "Failed to generate prescription PDF",
        );
      }

      const whatsapp = pdfResponse.data.whatsapp;
      const whatsappFailed = Boolean(pdfResponse.data.whatsappFailed);
      if (sendViaWhatsapp) {
        const alreadySentSkip =
          Boolean(whatsapp?.skipped) && whatsapp?.reason === "already_sent";
        const deliveredOk =
          Boolean(whatsapp?.success) && !whatsapp?.skipped && !whatsappFailed;

        if (deliveredOk) {
          setAlreadySentOnWhatsapp(true);
          setPrescriptionFinalized(true);
          setFinalizedVia("whatsapp");
          setDeliveryFailedMessage(null);
          toast({
            title: "Prescription sent on WhatsApp",
            description:
              "Patient will receive the download link. Further edits require a new prescription.",
          });
          onSaved?.({
            diagnosis: result.payload.diagnosis,
            prescribedTests: result.payload.prescribedTests,
            nextAppointment: result.payload.nextAppointment,
            prescriptionSummary: result.prescriptionSummary,
          });
          onPdfGenerated?.({
            s3Url: pdfResponse.data.s3Url,
            s3Key: pdfResponse.data.s3Key,
            documentName: pdfResponse.data.documentName,
          });
          return;
        }

        if (alreadySentSkip) {
          setAlreadySentOnWhatsapp(true);
          setPrescriptionFinalized(true);
          setFinalizedVia("whatsapp");
          setConfirmNewRxOpen(true);
          toast({
            title: "Prescription already sent",
            description: "Create a new prescription if you need to change medicines or tests.",
          });
          return;
        }

        const message =
          (typeof pdfResponse.message === "string" &&
          pdfResponse.message.toLowerCase().includes("whatsapp")
            ? pdfResponse.message
            : null) || formatWhatsappFailureMessage(whatsapp);
        setConfirmSendOpen(false);
        setSendErrorMessage(message);
        // Open after confirm dialog unmounts so the failure popup is visible.
        window.setTimeout(() => setSendErrorOpen(true), 50);
        toast({
          title: "WhatsApp send failed",
          description: message,
          variant: "destructive",
        });
        onPdfGenerated?.({
          s3Url: pdfResponse.data.s3Url,
          s3Key: pdfResponse.data.s3Key,
          documentName: pdfResponse.data.documentName,
        });
        return;
      }

      toast({
        title: "Prescription PDF saved",
        description: "PDF stored successfully. You can still edit until WhatsApp send.",
      });

      onSaved?.({
        diagnosis: result.payload.diagnosis,
        prescribedTests: result.payload.prescribedTests,
        nextAppointment: result.payload.nextAppointment,
        prescriptionSummary: result.prescriptionSummary,
      });
      onPdfGenerated?.({
        s3Url: pdfResponse.data.s3Url,
        s3Key: pdfResponse.data.s3Key,
        documentName: pdfResponse.data.documentName,
      });
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate or send prescription";
      setSendErrorMessage(
        `${message} Please try again, or print/share the prescription manually with the patient.`,
      );
      setSendErrorOpen(true);
      toast({
        title: "Send failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handlePrimarySendClick = () => {
    if (formLocked) {
      setConfirmNewRxOpen(true);
      return;
    }
    if (sendViaWhatsapp) {
      setConfirmSendOpen(true);
      return;
    }
    void executeSendPrescription();
  };

  const finalizeAndPrint = async () => {
    if (!appointmentId) {
      window.print();
      return;
    }
    setFinalizing(true);
    try {
      const response = await post(`/api/appointments/${appointmentId}/prescription/finalize`);
      if (!response.success) {
        throw new Error(
          typeof response.message === "string"
            ? response.message
            : "Failed to mark prescription as completed",
        );
      }
      setPrescriptionFinalized(true);
      setFinalizedVia("print");
      setSendErrorOpen(false);
      toast({
        title: "Prescription completed",
        description: "Marked as done after print. This prescription is now non-editable.",
      });
      window.print();
    } catch (err) {
      toast({
        title: "Could not finalize prescription",
        description: err instanceof Error ? err.message : "Printing anyway.",
        variant: "destructive",
      });
      window.print();
    } finally {
      setFinalizing(false);
    }
  };

  const startNewPrescription = async () => {
    if (!appointmentId) {
      resetFormToBlank();
      setAlreadySentOnWhatsapp(false);
      setPrescriptionFinalized(false);
      setFinalizedVia(null);
      setDeliveryFailedMessage(null);
      setConfirmNewRxOpen(false);
      return;
    }
    setStartingNew(true);
    try {
      const response = await post(
        `/api/appointments/${appointmentId}/prescription/start-new`,
      );
      if (!response.success) {
        throw new Error(
          typeof response.message === "string"
            ? response.message
            : "Failed to start a new prescription",
        );
      }
      resetFormToBlank();
      setAlreadySentOnWhatsapp(false);
      setPrescriptionFinalized(false);
      setFinalizedVia(null);
      setDeliveryFailedMessage(null);
      setConfirmNewRxOpen(false);
      await refreshPrescriptionList();
      toast({
        title: "New prescription started",
        description:
          "Form is blank. Previous prescriptions remain available in the list on the consultation page.",
      });
      onSaved?.({
        diagnosis: "",
        prescribedTests: "",
        nextAppointment: "",
        prescriptionSummary: "",
      });
    } catch (err) {
      toast({
        title: "Could not start new prescription",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setStartingNew(false);
    }
  };

  const deletePrescription = async () => {
    setDeleting(true);
    try {
      if (existingPrescriptionId) {
        const response = await del(`/api/prescriptions/${existingPrescriptionId}`);
        if (!response.success) {
          throw new Error(
            typeof response.message === "string"
              ? response.message
              : "Failed to delete prescription",
          );
        }
      } else if (alreadySentOnWhatsapp && appointmentId) {
        const response = await post(
          `/api/appointments/${appointmentId}/prescription/start-new`,
        );
        if (!response.success) {
          throw new Error(
            typeof response.message === "string"
              ? response.message
              : "Failed to delete prescription",
          );
        }
      }

      resetFormToBlank();
      setAlreadySentOnWhatsapp(false);
      setConfirmDeleteOpen(false);
      setPrescriptionOptions([]);
      toast({
        title: existingPrescriptionId ? "Prescription deleted" : "Prescription closed",
        description: "Returning to consultation.",
      });
      onSaved?.({
        diagnosis: "",
        prescribedTests: "",
        nextAppointment: "",
        prescriptionSummary: "",
      });
      onDeleted?.();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-xl bg-background shadow-2xl border border-border">
        <div className="sticky top-0 z-30 bg-background">
          {formLocked && (
            <div className="flex items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <p className="truncate">
                  {finalizedVia === "print"
                    ? "Prescription completed via print — view only. Create a new prescription to make changes."
                    : "Prescription already sent — view only. Create a new prescription to make changes."}
                  {deliveryFailedMessage ? ` WhatsApp delivery issue: ${deliveryFailedMessage}` : ""}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 shrink-0 border-amber-400 bg-white text-xs hover:bg-amber-100"
                onClick={() => setConfirmNewRxOpen(true)}
              >
                Create new
              </Button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div className="flex flex-wrap items-center gap-3 min-w-0">
              <h2 className="text-lg font-semibold whitespace-nowrap">Write Prescription</h2>
              {prescriptionOptions.length > 1 && (
                <select
                  className="text-sm border border-border rounded-md px-2 py-1 bg-background max-w-[220px]"
                  value={existingPrescriptionId || ""}
                  onChange={(e) => {
                    if (e.target.value) selectPrescriptionById(e.target.value);
                  }}
                  aria-label="Select prescription"
                >
                  {!existingPrescriptionId && (
                    <option value="">New draft</option>
                  )}
                  {prescriptionOptions.map((rx, index) => {
                    const medCount = (rx.medications || []).filter((m) => m.name?.trim()).length;
                    const when = rx.updatedAt || rx.prescribedAt || rx.createdAt;
                    const labelDate = when
                      ? new Date(when).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : `Rx ${index + 1}`;
                    const status =
                      rx.isActive === false ? "sent/archived" : "active";
                    return (
                      <option key={rx._id} value={rx._id}>
                        {labelDate} · {medCount} med · {status}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {loadingPrescription ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Loading prescription...
            </div>
          ) : (
            <>
              <PrescriptionHeader />

              <div className="flex items-center justify-between mb-2">
                <div />
                <select
                  className="text-sm border border-border rounded-md px-2 py-1 bg-background"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "en" | "hi")}
                  disabled={formLocked}
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी</option>
                </select>
              </div>

              <PrescriptionPatientDetails
                patientName={patientName}
                setPatientName={setPatientName}
                patientAge={patientAge}
                setPatientAge={setPatientAge}
                patientGender={patientGender}
                setPatientGender={setPatientGender}
                patientPhone={patientPhone}
                setPatientPhone={setPatientPhone}
                diagnosis={diagnosis}
                setDiagnosis={(value) => {
                  if (formLocked) {
                    setConfirmNewRxOpen(true);
                    return;
                  }
                  setDiagnosis(value);
                }}
                readOnlyPatient={formLocked}
              />

              <div className="rounded-md border border-border overflow-hidden mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-2 py-2 text-left font-medium">#</th>
                        <th className="px-2 py-2 text-left font-medium">Medicine</th>
                        <th className="px-2 py-2 text-left font-medium">Type</th>
                        <th className="px-2 py-2 text-left font-medium">Composition</th>
                        <th className="px-2 py-2 text-left font-medium">Dosage</th>
                        <th className="px-2 py-2 text-left font-medium">Timing / Freq / Duration</th>
                        <th className="px-2 py-2 text-left font-medium">Qty</th>
                        <th className="px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {medicines.map((medicine, index) => (
                        <PrescriptionMedicineRow
                          key={medicine.id}
                          index={index}
                          medicine={medicine}
                          onChange={updateMedicine}
                          onRemove={removeMedicine}
                          language={language}
                          readOnly={formLocked}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMedicine}
                className="mt-3 text-xs"
                disabled={formLocked}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Medicine
              </Button>

              <PrescriptionFooter
                prescribedTests={prescribedTests}
                setPrescribedTests={(value) => {
                  if (formLocked) {
                    setConfirmNewRxOpen(true);
                    return;
                  }
                  setPrescribedTests(value);
                }}
                nextAppointment={nextAppointment}
                setNextAppointment={(value) => {
                  if (formLocked) {
                    setConfirmNewRxOpen(true);
                    return;
                  }
                  setNextAppointment(value);
                }}
                readOnly={formLocked}
              />

              <div className="mt-4 rounded-md border border-border bg-muted/20 p-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="send-via-whatsapp"
                    checked={sendViaWhatsapp}
                    onCheckedChange={(checked) => setSendViaWhatsapp(checked === true)}
                    disabled={!patientPhone.trim() || formLocked}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="send-via-whatsapp" className="text-sm font-medium cursor-pointer">
                      Send prescription to patient via WhatsApp
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {formLocked
                        ? "Already sent for this visit. Create a new prescription to send again."
                        : patientPhone.trim()
                          ? `Uses approved template with download link for ${patientPhone.trim()}.`
                          : "Add a patient phone number to enable WhatsApp delivery."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-border">
                <Button
                  onClick={handlePrimarySendClick}
                  disabled={
                    saving ||
                    sending ||
                    startingNew ||
                    loadingPrescription ||
                    !appointmentId
                  }
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {sending || startingNew ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : formLocked ? (
                    <Plus className="h-4 w-4 mr-2" />
                  ) : sendViaWhatsapp ? (
                    <MessageCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {startingNew
                    ? "Starting..."
                    : sending
                      ? sendViaWhatsapp
                        ? "Sending on WhatsApp..."
                        : "Saving PDF..."
                      : formLocked
                        ? "Create new prescription"
                        : sendViaWhatsapp
                          ? "Send Prescription on WhatsApp"
                          : "Save Prescription PDF"}
                </Button>
                <Button
                  onClick={savePrescription}
                  disabled={saving || sending || loadingPrescription || formLocked}
                  variant="outline"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saving ? "Saving..." : "Save Prescription"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  disabled={saving || sending || finalizing}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>

              <div className="mt-4 flex justify-start border-t border-border pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={deleting || saving || sending || loadingPrescription}
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  {deleting ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Delete prescription
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <AlertDialog open={confirmSendOpen} onOpenChange={setConfirmSendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send prescription on WhatsApp?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Please confirm the prescription is complete (medicines, tests, and follow-up).
                </p>
                <p>
                  After it is sent, you will not be able to edit this prescription. To change
                  anything later, you will need to create a new prescription.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={sending}
              onClick={(e) => {
                e.preventDefault();
                setConfirmSendOpen(false);
                void executeSendPrescription();
              }}
            >
              Yes, send on WhatsApp
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmNewRxOpen} onOpenChange={setConfirmNewRxOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Prescription already sent</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  This prescription was already sent to the patient on WhatsApp, so it cannot be
                  modified.
                </p>
                <p>
                  Create a new prescription to add or change medicines and tests. The new form
                  will start blank (no previous medicines or tests).
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={startingNew}>Keep as sent</AlertDialogCancel>
            <AlertDialogAction
              disabled={startingNew}
              onClick={(e) => {
                e.preventDefault();
                void startNewPrescription();
              }}
            >
              {startingNew ? "Starting..." : "Create new prescription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={sendErrorOpen} onOpenChange={setSendErrorOpen}>
        <AlertDialogContent className="z-[300]">
          <AlertDialogHeader>
            <AlertDialogTitle>Could not send prescription</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {sendErrorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={finalizing}>Close</AlertDialogCancel>
            <AlertDialogAction
              disabled={finalizing}
              onClick={(e) => {
                e.preventDefault();
                void finalizeAndPrint();
              }}
            >
              {finalizing ? "Saving..." : "Print & mark done"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this prescription?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  This removes the prescription for this visit so you can start over.
                </p>
                {alreadySentOnWhatsapp ? (
                  <p>
                    It was already sent on WhatsApp. Deleting clears the lock and blanks the form;
                    the patient may still have the previous message.
                  </p>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void deletePrescription();
              }}
            >
              {deleting ? "Deleting..." : "Delete prescription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>,
    document.body,
  );
}
